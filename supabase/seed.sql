-- fake rows to design against. delete before launch (see bottom).

insert into listings (identity_key, display_url, title, description, total_paid, clicks, category, favicon_url, created_at) values
  ('outboundos.app',      'https://outboundos.app',      'outbound os',          'free linkedin client-getting tool',        24000, 142, 'marketing',   'https://www.google.com/s2/favicons?domain=outboundos.app&sz=64',      now() - interval '6 days'),
  ('coldplunge.dev',      'https://coldplunge.dev',      'cold plunge tracker',  'logs your plunges. that is it.',           18000,  98, 'health',      'https://www.google.com/s2/favicons?domain=coldplunge.dev&sz=64',      now() - interval '5 days'),
  ('x:jamil',             'https://x.com/jamil',         '@jamil',               'posts about building things',              12000,  61, 'other',       null,                                                                  now() - interval '5 days'),
  ('ratemysetup.lol',     'https://ratemysetup.lol',     'rate my setup',        'strangers judge your desk',                 9000,  44, 'design',      'https://www.google.com/s2/favicons?domain=ratemysetup.lol&sz=64',     now() - interval '4 days'),
  ('tinyinvoice.co',      'https://tinyinvoice.co',      'tiny invoice',         'invoices for people who hate invoices',     9000,  37, 'saas',        'https://www.google.com/s2/favicons?domain=tinyinvoice.co&sz=64',      now() - interval '3 days'),
  ('x:sana_builds',       'https://x.com/sana_builds',   '@sana_builds',         'shipping one product a month',              7000,  29, 'other',       null,                                                                  now() - interval '2 days'),
  ('plaintextsports.com', 'https://plaintextsports.com', 'plain text sports',    'scores with zero javascript',               600,   12, 'games',       'https://www.google.com/s2/favicons?domain=plaintextsports.com&sz=64', now() - interval '1 day'),
  ('sundaycode.club',     'https://sundaycode.club',     'sunday code club',     'a newsletter for weekend builders',          500,    8, 'newsletters', 'https://www.google.com/s2/favicons?domain=sundaycode.club&sz=64',     now() - interval '10 hours');

-- to delete the seed rows before launch:
-- delete from listings where identity_key in (
--   'outboundos.app','coldplunge.dev','x:jamil','ratemysetup.lol',
--   'tinyinvoice.co','x:sana_builds','plaintextsports.com','sundaycode.club'
-- );
