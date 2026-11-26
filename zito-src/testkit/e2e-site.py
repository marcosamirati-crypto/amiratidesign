# Teste ponta a ponta: Mestre + 2 jogadores em navegadores separados,
# fluxo completo da FASE 6 + permissões, reconexão, persistência e concorrência.
import json, os, re, sys, time, urllib.request
from playwright.sync_api import sync_playwright, expect

BASE = 'http://localhost:8788/zito/'
RELAY = 'relay=ws://localhost:8788/relay'
SHOTS = '/home/claude/zito/shots-site'
os.makedirs(SHOTS, exist_ok=True)
results = []

def ok(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + (f' :: {detail}' if detail else ''), flush=True)

def shot(page, name):
    page.screenshot(path=f'{SHOTS}/{name}.png', full_page=False)

MASTER = None
def dump():
    return MASTER.evaluate("() => JSON.parse(localStorage.getItem('sod.host.mestre') || '{}')")

def create_player(p, code, player_name, char_name, plan, look=None):
    p.goto(f'{BASE}?{RELAY}#{INVITE_HASH}')
    p.wait_for_selector('#player-name', timeout=15000)
    p.fill('#player-name', player_name)
    p.click('text=Criar personagem')
    p.fill('#char-name', char_name)
    p.click('text=Continuar')
    # posiciona 9,7,5,5,5,5,3 na ordem dos atributos dados
    order = look['order']
    for attr in order:
        p.locator('.chip.num').first.click()
        first = {'Agilidade': 'velocidade', 'Carisma': 'lábia', 'Força': 'levantar', 'Força Mental': 'resiliência', 'Inteligência': 'sabedoria', 'Percepção': 'sentidos', 'Resistência': 'vigor'}[attr]
        p.get_by_role('button', name=re.compile('^' + attr + ' ' + first)).click()
    for attr, n in look['free'].items():
        for _ in range(n):
            p.click(f'.step-b[aria-label="Aumentar {attr}"]')
    if char_name == 'Ilda':
        shot(p, '03-atributos')
    p.click('text=Continuar')
    p.click('text=Rolar D100')
    p.wait_for_selector('.luck-n', timeout=5000)
    p.wait_for_timeout(700)
    p.click('text=Continuar')
    p.click('.chip:has-text("Boxe")')
    p.click('.chip:has-text("Nadar")')
    p.click('text=Continuar')
    if char_name == 'Ilda':
        p.click('button[aria-label="Cor 2"] >> nth=0')
        p.click('.seg button:has-text("longo")')
        shot(p, '04-retrato')
    p.click('text=Revisar ficha')
    shot(p, f'05-revisao-{plan}')
    p.click('text=Enviar ao Mestre')
    p.wait_for_selector('text=Esperando o Mestre', timeout=8000)

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    mk = lambda: browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    cm, c1, c2 = mk(), mk(), mk()
    m, p1, p2 = cm.new_page(), c1.new_page(), c2.new_page()
    errors = []
    for name, pg in (('mestre', m), ('p1', p1), ('p2', p2)):
        pg.on('pageerror', lambda e, n=name: errors.append(f'{n}: {e}'))

    # 1. Mestre cria a sala
    MASTER = m
    m.goto(f'{BASE}?perfil=mestre&{RELAY}')
    m.wait_for_selector('#room-code', timeout=15000)
    shot(m, '00-entrada')
    m.click('text=Sou o Mestre')
    m.wait_for_selector('#new-session', timeout=15000)
    shot(m, '01-mestre-lobby')
    m.fill('#new-session', 'A Galeria das Formigas')
    m.click('text=Criar sessão')
    m.wait_for_selector('.code-chip.big', timeout=10000)
    code = m.locator('.code-chip.big').inner_text().strip()[-4:]
    ok('Mestre cria sala com código de 4 letras', len(code) == 4, code)
    m.click('.code-chip.big')
    m.wait_for_selector('.qr svg')
    ok('QR do convite gerado', m.locator('.qr svg').count() == 1)
    link = m.locator('.mono-break').inner_text().strip()
    INVITE_HASH = link.split('#', 1)[1]
    ok('Link do convite traz código e impressão digital do Mestre', INVITE_HASH.startswith(code + '.') and len(INVITE_HASH) == 13, link)
    shot(m, '02-convite-qr')
    m.click('button[aria-label="Fechar"]')

    # Mestre cria o local inicial no mapa
    m.click('.tab:has-text("Mapa")')
    m.click('button:has-text("Local")')
    box = m.locator('.map-box').bounding_box()
    m.mouse.click(box['x'] + box['width'] * 0.3, box['y'] + box['height'] * 0.5)
    m.wait_for_selector('#pl-name')
    m.fill('#pl-name', 'Acampamento')
    m.click('.sheet .seg button:has-text("O grupo")')
    m.check('#pl-start')
    m.click('.sheet button:has-text("Salvar")')
    m.wait_for_timeout(600)
    d = dump()
    SID = [k for k, v in d.items() if k.startswith('sessions/') and k.count('/') == 1 and v.get('code') == code][0].split('/')[1]
    sess = d['sessions/' + SID]
    ok('Local criado e publicado no mapa público', any(p['name'] == 'Acampamento' for p in sess['map']['places'].values()))
    m.click('.tab:has-text("Mesa")')

    # 2-4. Jogadores entram e criam personagens
    create_player(p1, code, 'Ana', 'Ilda', 'p1', {'order': ['Agilidade', 'Percepção', 'Força', 'Força Mental', 'Inteligência', 'Resistência', 'Carisma'], 'free': {'Resistência': 4, 'Força Mental': 4}})
    shot(p1, '06-esperando')
    create_player(p2, code, 'Beto', 'Marcos', 'p2', {'order': ['Força', 'Resistência', 'Agilidade', 'Força Mental', 'Inteligência', 'Percepção', 'Carisma'], 'free': {'Força': 3, 'Agilidade': 5}})

    # 5. Mestre vê os dois chegando e aprova
    m.wait_for_selector('.card.join', timeout=8000)
    ok('Mestre vê as fichas chegando em tempo real', m.locator('.card.join').count() == 2, str(m.locator('.card.join').count()))
    shot(m, '07-mestre-chegando')
    ok('Validação das regras aprovada', m.locator('.card.join .note.good').count() == 2)
    for _ in range(2):
        m.locator('.card.join select').first.select_option(label='Acampamento')
        m.locator('.card.join button:has-text("Aprovar")').first.click()
        m.wait_for_timeout(700)
    m.wait_for_selector('article.char', timeout=8000)
    ok('Mestre visualiza os dois personagens', m.locator('article.char').count() == 2)

    for pg, nm in ((p1, 'p1'), (p2, 'p2')):
        pg.wait_for_selector('.intro-card', timeout=8000)
    ok('Introdução personalizada aparece e assina — Zito', '— Zito' in p1.locator('.intro-card').inner_text() and 'Acampamento' in p1.locator('.intro-card').inner_text())
    shot(p1, '08-introducao')
    for pg in (p1, p2):
        pg.click('text=Entrar na sessão')
        pg.wait_for_selector('.vitals', timeout=8000)
    shot(p1, '09-hud-ilda')
    hud = p1.locator('.vitals').inner_text()
    ok('HUD mostra Vida 2×Res e Sanidade 2×FM', '18/18' in hud and '18/18' in hud.split('Sanidade')[1], hud.replace('\n', ' ')[:80])
    shot(m, '10-mestre-mesa')

    # 6-9. Narração por texto, prévia, confirmação, atualização nos celulares
    m.click('.tab:has-text("Narrar")')
    m.fill('#narr-text', 'Depois de caminhar por algumas horas, o grupo chega a uma região desconhecida. Durante a travessia, Marcos encontra uma bolsa caída próxima a uma árvore. Dentro dela existem três moedas. Talvez Ilda encontre uma espada. Ilda sofre 3 de dano.')
    m.click('text=Interpretar')
    m.wait_for_selector('.preview', timeout=5000)
    prev = m.locator('.preview').inner_text()
    ok('Prévia classifica hipótese sem gerar alteração', 'Hipótese' in prev and 'espada' not in m.locator('.changes').inner_text())
    ok('Prévia sugere mover o grupo, bolsa, 3 moedas e dano', m.locator('.chg').count() == 4, str(m.locator('.chg').count()))
    shot(m, '11-previa')
    U1 = p1.evaluate('() => window.__sod.site.keys.uid'); U2 = p2.evaluate('() => window.__sod.site.keys.uid')
    vida_antes = dump()['pc/' + U1 + '/s/' + SID]['vida']
    m.click('.preview button:has-text("Aplicar")')
    m.wait_for_timeout(1200)
    p2.click('.tab:has-text("Mochila")')
    p2.wait_for_selector('.item', timeout=5000)
    bag = p2.locator('.slots').inner_text()
    ok('Mochila do Marcos recebeu bolsa e 3 moedas sem recarregar', 'Bolsa caída' in bag and '×3' in bag, bag.replace('\n', ' '))
    shot(p2, '12-mochila-marcos')
    p1.wait_for_timeout(500)
    ok('Vida da Ilda caiu 3 no celular dela', f'{vida_antes - 3}/18' in p1.locator('.vitals').inner_text())
    ok('Local atualizado para Região desconhecida', 'Região desconhecida' in p1.locator('.tb-place').inner_text())
    p1.click('.tab:has-text("Diário")')
    ok('Diário recebe o acontecimento público', 'região desconhecida' in p1.locator('.view').inner_text())
    shot(p1, '13-diario')

    # 10-14. Segunda narração (a voz entra pelo mesmo campo), visibilidade individual, histórico e mapa
    m.fill('#narr-text', 'Marcos encontra um mapa rasgado.')
    m.click('text=Interpretar')
    m.wait_for_selector('.preview')
    m.click('.preview .seg button:has-text("Só alguns")')
    m.click('.preview .chip.check:has-text("Marcos") input')
    m.click('.preview button:has-text("Aplicar")')
    m.wait_for_timeout(1000)
    p2.click('.tab:has-text("Diário")')
    ok('Mensagem individual chega só para o Marcos', 'mapa rasgado' in p2.locator('.view').inner_text() and 'Só para você' in p2.locator('.view').inner_text())
    ok('Ilda não recebe o segredo do Marcos', 'mapa rasgado' not in p1.locator('.view').inner_text())
    m.click('.tab:has-text("Registro")')
    reg = m.locator('.view').inner_text()
    ok('Histórico do Mestre tem os dois acontecimentos', 'região desconhecida' in reg and 'mapa rasgado' in reg)
    m.click('.seg button:has-text("Alterações")')
    ok('Auditoria registra alterações com Desfazer', m.locator('.audit button:has-text("Desfazer")').count() >= 2)
    m.click('.tab:has-text("Mapa")')
    m.wait_for_timeout(400)
    ok('Mapa do Mestre acompanha o deslocamento (novo local + trilha)', 'Região desconhecida' in m.locator('.map-box').inner_html() and 'm-trail' in m.locator('.map-box').inner_html())
    shot(m, '14-mapa-mestre')

    # Zona de caos: Mestre cria a Bruma sobre a região; Ilda está dentro e não a vê
    m.click('button:has-text("Zona de Caos")')
    d = dump(); sid = SID
    gm = d['gm/' + sid]
    reg_place = [p for p in gm['map']['places'].values() if p['name'] == 'Região desconhecida'][0]
    box = m.locator('.map-box').bounding_box()
    m.mouse.click(box['x'] + box['width'] * reg_place['x'] / 1000, box['y'] + box['height'] * reg_place['y'] / 700)
    try:
        m.wait_for_selector('.sheet input[type=checkbox]', timeout=4000)
    except Exception:
        shot(m, 'fail-zone'); print('map html:', m.locator('.map-box').inner_html()[:1500]); print('coords', reg_place, box); raise
    m.locator('.sheet label.check input').check()
    m.click('.sheet button:has-text("Salvar")')
    m.wait_for_timeout(1200)
    p1.click('.tab:has-text("Mapa")')
    p1.wait_for_timeout(500)
    ok('Dentro da Bruma o jogador não vê a névoa', 'data-zone' not in p1.locator('.map-box').inner_html() and 'natureza parece corrompido' in p1.locator('.view').inner_text())
    shot(p1, '15-mapa-dentro-da-bruma')
    p1.click('.tab:has-text("HUD")')
    shot(p1, '16-hud-dentro-da-bruma')

    # Permissões
    r = p1.evaluate("""async ([sid, u1, u2]) => { const db = window.__sod.cap.db; const out = {};
      try { await db.doc('pc/' + u1 + '/s/' + sid).update({ vida: 999 }); out.selfWrite = 'aceito'; } catch (e) { out.selfWrite = e.code; }
      try { await db.doc('pc/' + u2 + '/s/' + sid).get().then(s => out.otherRead = s.exists); } catch (e) { out.otherRead = e.code; }
      out.gm = (await db.doc('gm/' + sid).get()).exists;
      try { await db.doc('sessions/' + sid).update({ name: 'hack' }); out.sessWrite = 'aceito'; } catch (e) { out.sessWrite = e.code; }
      try { await db.doc('req/' + u2).set({ sid: 'x' }); out.otherReq = 'aceito'; } catch (e) { out.otherReq = e.code; }
      return out; }""", [sid, U1, U2])
    ok('Jogador não altera a própria Vida direto no banco', r['selfWrite'] == 'invalid_argument', str(r))
    ok('Jogador não lê a ficha do outro', r['otherRead'] is False)
    ok('Jogador não lê os segredos do Mestre', r['gm'] is False)
    ok('Jogador não altera a sessão', r['sessWrite'] == 'invalid_argument')
    ok('Jogador não escreve pedido em nome de outro', r['otherReq'] == 'invalid_argument')

    # Pedido do jogador: gastar dados da reserva (aprovado automaticamente pelo Mestre)
    p1.click('text=Rolar dados')
    p1.locator('.rp-die').nth(1).click()
    p1.click('.sheet .btn.primary.big')
    p1.wait_for_selector('.total-n', timeout=4000)
    p1.wait_for_timeout(1500)
    p1.click('button[aria-label="Fechar"]')
    p1.wait_for_timeout(500)
    spent = p1.locator('.dice-card .die.spent').count()
    ok('Gasto de 2 dados da reserva aplicado pelo Mestre', spent == 2, str(spent))
    shot(p1, '17-reserva-gasta')

    # Reconexão: derruba a conexão do jogador 1, Mestre altera a vida, jogador recebe ao voltar
    p1.evaluate('() => window.__sodDrop()')
    m.click('.tab:has-text("Mesa")')
    m.locator('article.char', has_text='Ilda').locator('button[aria-label="Vida −1"]').click()
    m.wait_for_timeout(1800)
    m.wait_for_timeout(1500)
    vida_now = dump()['pc/' + U1 + '/s/' + sid]['vida']
    ok('Após queda de conexão o HUD se atualiza ao reconectar', f'{vida_now}/18' in p1.locator('.vitals').inner_text(), str(vida_now))

    # Concorrência: três cliques rápidos viram três alterações sequenciais
    v0 = dump()['pc/' + U2 + '/s/' + sid]['vida']
    btn = m.locator('article.char', has_text='Marcos').locator('button[aria-label="Vida −1"]')
    for _ in range(3): btn.click()
    m.wait_for_timeout(2000)
    v1 = dump()['pc/' + U2 + '/s/' + sid]['vida']
    ok('Cliques simultâneos do Mestre não se perdem', v1 == v0 - 3, f'{v0}->{v1}')

    # Persistência: recarregar o celular do jogador volta para a mesma ficha
    p2.reload()
    p2.wait_for_selector('.vitals', timeout=10000)
    ok('Recarregar a página volta direto para a ficha (persistência)', 'Marcos' in p2.locator('.tb-name').inner_text())

    # Desfazer
    m.click('.tab:has-text("Registro")')
    m.click('.seg button:has-text("Alterações")')
    m.locator('.audit button:has-text("Desfazer")').first.click()
    m.wait_for_timeout(1200)
    v2 = dump()['pc/' + U2 + '/s/' + sid]['vida']
    ok('Desfazer volta a última alteração', v2 == v1 + 1, f'{v1}->{v2}')

    # Mestre recarrega a página: a mesa continua no aparelho e os jogadores voltam sozinhos
    m.reload()
    m.wait_for_selector('.card.pick', timeout=10000)
    m.locator('.card.pick').first.click()
    m.wait_for_selector('article.char', timeout=10000)
    ok('Mesa sobrevive ao Mestre recarregar a página (persistência no aparelho)', m.locator('article.char').count() == 2)
    p1.wait_for_timeout(6000)
    vb = dump()['pc/' + U1 + '/s/' + sid]['vida']
    m.locator('article.char', has_text='Ilda').locator('button[aria-label="Vida −1"]').click()
    for _ in range(16):  # até 8 s: o jogador precisa reencontrar o Mestre
        if f'{vb - 1}/18' in p1.locator('.vitals').inner_text(): break
        p1.wait_for_timeout(500)
    ok('Jogador volta a receber atualizações depois que o Mestre volta', f'{vb - 1}/18' in p1.locator('.vitals').inner_text(), str(vb - 1))
    # Bestiário vem do servidor e fica só no aparelho do Mestre
    m.click('.tab:has-text("Mais")'); m.click('.seg button:has-text("Bestiário")'); m.wait_for_selector('.queen-grid', timeout=6000)
    ok('Bestiário carregado do servidor para o Mestre', m.locator('.queen-grid i').count() == 49)
    shot(m, '20-bestiario')
    r2 = p1.evaluate("async () => (await window.__sod.cap.db.doc('gm/bestiario').get()).exists")
    ok('Jogador não lê o bestiário', r2 is False)
    m.click('.tab:has-text("Mesa")')

    # Mestre: editor e bestiário (sem seed não quebra)
    m.click('.tab:has-text("Mesa")')
    m.locator('article.char', has_text='Ilda').click()
    m.wait_for_selector('.sheet')
    shot(m, '18-editor-personagem')
    m.click('button[aria-label="Fechar"]')
    m.click('.tab:has-text("Mais")')
    m.click('.seg button:has-text("Sessão")')
    ok('Cartão de backup da campanha disponível', m.locator('text=Baixar backup').count() == 1)
    with m.expect_download() as dl:
        m.click('text=Baixar backup')
    bk = json.loads(open(dl.value.path()).read())
    ok('Backup contém a sessão, as fichas e a chave do Mestre', bk['formato'] == 'survival-or-dice/backup' and ('sessions/' + sid) in bk['dados'] and bk['chaveDoMestre']['pub'])
    shot(m, '19-mestre-sessao')

    ok('Nenhum erro de JavaScript nas páginas', not errors, '; '.join(errors)[:400])
    browser.close()

passed = sum(1 for r in results if r[1])
print(f'\n{passed}/{len(results)} verificações passaram')
sys.exit(0 if passed == len(results) else 1)
