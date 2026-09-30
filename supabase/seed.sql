-- Seed: 4 projetos placeholder (capas SVG geradas pelo próprio site em /placeholder/...)
-- Troque pelas imagens reais pelo painel /admin depois.

insert into public.projects (slug, title, client, type, year, summary, external_url, cover_url, images, published, sort_order) values
('aurora-cafe', 'Aurora Café', 'Aurora Café', 'identidade-visual', 2025,
 'Identidade visual completa para uma cafeteria de bairro: logotipo, paleta quente, tipografia e aplicações em embalagens e fachada.',
 null, '/placeholder/aurora-cafe-0',
 array['/placeholder/aurora-cafe-1','/placeholder/aurora-cafe-2','/placeholder/aurora-cafe-3'], true, 1),
('nordeste-studio', 'Nordeste Studio', 'Nordeste Studio', 'branding', 2025,
 'Projeto de branding para um estúdio de arquitetura: posicionamento, voz, sistema visual e manual de marca.',
 null, '/placeholder/nordeste-studio-0',
 array['/placeholder/nordeste-studio-1','/placeholder/nordeste-studio-2','/placeholder/nordeste-studio-3'], true, 2),
('pulso-fit', 'Pulso Fit', 'Pulso Fit', 'social-media', 2024,
 'Gestão gráfica do Instagram de uma academia: templates de feed, stories e capas de destaque com identidade consistente.',
 null, '/placeholder/pulso-fit-0',
 array['/placeholder/pulso-fit-1','/placeholder/pulso-fit-2','/placeholder/pulso-fit-3'], true, 3),
('mare-alta', 'Maré Alta', 'Maré Alta Cervejaria', 'identidade-visual', 2024,
 'Rótulos, logotipo e sistema visual para uma cervejaria artesanal litorânea.',
 null, '/placeholder/mare-alta-0',
 array['/placeholder/mare-alta-1','/placeholder/mare-alta-2','/placeholder/mare-alta-3'], true, 4)
on conflict (slug) do nothing;
