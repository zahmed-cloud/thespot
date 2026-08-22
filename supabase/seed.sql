-- 8 fake rows to design against. delete before launch (see bottom).

insert into listings (identity_key, display_url, title, description, total_paid, clicks, created_at) values
  ('outboundos.app',      'https://outboundos.app',      'outbound os',          'free linkedin client-getting tool',        24000, 142, now() - interval '6 days'),
  ('coldplunge.dev',      'https://coldplunge.dev',      'cold plunge tracker',  'logs your plunges. that is it.',           18000,  98, now() - interval '5 days'),
  ('x:jamil',             'https://x.com/jamil',         '@jamil',               'posts about building things',              12000,  61, now() - interval '5 days'),
  ('ratemysetup.lol',     'https://ratemysetup.lol',     'rate my setup',        'strangers judge your desk',                 9000,  44, now() - interval '4 days'),
  ('tinyinvoice.co',      'https://tinyinvoice.co',      'tiny invoice',         'invoices for people who hate invoices',     9000,  37, now() - interval '3 days'),
  ('x:sana_builds',       'https://x.com/sana_builds',   '@sana_builds',         'shipping one product a month',              7000,  29, now() - interval '2 days'),
  ('plaintextsports.com', 'https://plaintextsports.com', 'plain text sports',    'scores with zero javascript',               600,   12, now() - interval '1 day'),
  ('sundaycode.club',     'https://sundaycode.club',     'sunday code club',     'a newsletter for weekend builders',          500,    8, now() - interval '10 hours');

-- to delete the seed rows before launch:
-- delete from listings where identity_key in (
--   'outboundos.app','coldplunge.dev','x:jamil','ratemysetup.lol',
--   'tinyinvoice.co','x:sana_builds','plaintextsports.com','sundaycode.club'
-- );
