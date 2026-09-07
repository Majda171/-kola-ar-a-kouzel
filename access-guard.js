(() => {
  const root = document.documentElement;
  const page = location.pathname.split('/').pop() || 'index.html';
  const publicPages = new Set([
    'index.html',
    'registrace.html',
    'prihlaseni-student.html',
    'admin-login.html',
    'vylouceni.html'
  ]);

  // Veřejné stránky do studentského zámku nespadají.
  if (publicPages.has(page) || page.startsWith('admin')) return;

  // Chráněná stránka je od první chvíle skrytá. Odemkne se až po
  // serverovém ověření aktivní Supabase session a existujícího profilu.
  root.classList.add('access-pending');

  let done = false;
  const next = encodeURIComponent(page + (location.search || '') + (location.hash || ''));

  function toLogin() {
    if (done) return;
    done = true;
    location.replace(`prihlaseni-student.html?next=${next}`);
  }

  function redirect(url) {
    if (done) return;
    done = true;
    location.replace(url);
  }

  function unlock() {
    if (done) return;
    done = true;
    root.classList.remove('access-pending');
  }

  async function clearLocalAuth(client) {
    try { await client?.auth?.signOut?.({ scope: 'local' }); } catch {}
  }

  async function verify() {
    const DB = window.BradaviceDB;
    const client = DB?.client;
    if (!client) return toLogin();

    // Nejdřív musí existovat lokální session.
    let sessionUser = null;
    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data?.session?.user) return toLogin();
      sessionUser = data.session.user;
    } catch {
      return toLogin();
    }

    // A následně ji ověří Supabase server. Samotný token v localStorage nestačí.
    let verifiedUser = null;
    try {
      const { data, error } = await client.auth.getUser();
      if (error || !data?.user || data.user.id !== sessionUser.id) {
        await clearLocalAuth(client);
        return toLogin();
      }
      verifiedUser = data.user;
    } catch {
      await clearLocalAuth(client);
      return toLogin();
    }

    // Do hradu patří pouze Auth účet se skutečným profilem.
    let profile = null;
    try {
      const { data, error } = await client
        .from('profiles')
        .select('house_code,is_admin,banned_at,ban_reason')
        .eq('id', verifiedUser.id)
        .maybeSingle();
      if (error || !data) {
        await clearLocalAuth(client);
        return toLogin();
      }
      profile = data;
    } catch {
      await clearLocalAuth(client);
      return toLogin();
    }

    if (profile.banned_at) return redirect('vylouceni.html');

    const sortingPages = new Set([
      'prijeti.html',
      'rozrazeni.html',
      'Nebelvir.html',
      'Havraspar.html',
      'Mrzimor.html',
      'Zmijozel.html'
    ]);
    if (!profile.house_code && !profile.is_admin && !sortingPages.has(page)) {
      return redirect('rozrazeni.html');
    }

    try { await DB.hydrateStudent?.(); } catch {}
    unlock();
  }

  // Kdyby se uživatel odhlásil v jiné záložce během otevřené stránky,
  // zavřeme ji také. Na běžný logout se po signOut stejně přesměruje na úvod.
  try {
    window.BradaviceDB?.client?.auth?.onAuthStateChange?.((event, session) => {
      if (event === 'SIGNED_OUT' || !session) toLogin();
    });
  } catch {}

  // Když ověření z nějakého důvodu visí, hrad se nikdy neodemkne.
  const timeout = setTimeout(toLogin, 8000);
  Promise.resolve(verify()).finally(() => clearTimeout(timeout));
})();
