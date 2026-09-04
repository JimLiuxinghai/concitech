const modelContext = document.modelContext;

if (modelContext?.registerTool && !window.__concitechWebMCP) {
  const controller = new AbortController();
  window.__concitechWebMCP = controller;

  const pages = [
    { kind: 'page', title: 'Concitech 首页', description: '独立项目、开发笔记与维护原则。', url: '/' },
    { kind: 'page', title: '关于 Concitech', description: '站点定位、作者与关注方向。', url: '/about' },
    { kind: 'page', title: '联系 Concitech', description: '项目反馈、内容修正与权利请求渠道。', url: '/contact' },
    { kind: 'page', title: '编辑与内容原则', description: '内容来源、修正和发布标准。', url: '/editorial-policy' },
  ];

  const sourceDefinitions = {
    project: { path: '/projects', selector: '.project-detail' },
    note: { path: '/notes', selector: '.article-card' },
  };

  function compact(value, limit = 220) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
  }

  async function loadCards(kind) {
    const source = sourceDefinitions[kind];
    const response = await fetch(source.path, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`无法读取 ${source.path}，HTTP ${response.status}`);

    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, 'text/html');

    return [...parsed.querySelectorAll(source.selector)].map((card) => {
      const link = card.querySelector('a[href]');
      const title = card.querySelector('h2, h3')?.textContent;
      const description = [...card.querySelectorAll('p')]
        .map((paragraph) => paragraph.textContent)
        .find((text) => text && !/^\d{2}\s*\//.test(text.trim()));

      return {
        kind,
        title: compact(title, 100),
        description: compact(description),
        url: link ? new URL(link.getAttribute('href'), location.origin).href : new URL(source.path, location.origin).href,
      };
    });
  }

  function serialize(query, kind, results, warning) {
    const payload = {
      query: query || null,
      kind,
      count: results.length,
      results: results.slice(0, 6),
      ...(warning ? { warning } : {}),
    };
    while (JSON.stringify(payload).length > 1450 && payload.results.length > 1) payload.results.pop();
    payload.count = payload.results.length;
    return JSON.stringify(payload);
  }

  modelContext.registerTool({
    name: 'find_concitech_content',
    description: '查找 Concitech 的独立项目、开发笔记和站点页面，返回可直接打开的标题、摘要与链接。',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '可选关键词，例如 Hexo、截图、AI 日报或 Tweet Craft。' },
        kind: {
          type: 'string',
          enum: ['all', 'project', 'note', 'page'],
          description: '要查找的内容类型，默认 all。',
        },
      },
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: async ({ query = '', kind = 'all' } = {}) => {
      if (!['all', 'project', 'note', 'page'].includes(kind)) {
        throw new Error('kind 必须是 all、project、note 或 page。');
      }

      const requestedKinds = kind === 'all' ? ['project', 'note'] : [kind].filter((value) => value !== 'page');
      const settled = await Promise.allSettled(requestedKinds.map(loadCards));
      const loaded = settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
      const candidates = kind === 'page' ? pages : kind === 'all' ? [...loaded, ...pages] : loaded;
      const normalizedQuery = compact(query, 120).toLocaleLowerCase('zh-CN');
      const results = candidates.filter((item) => {
        if (!normalizedQuery) return true;
        return `${item.title} ${item.description}`.toLocaleLowerCase('zh-CN').includes(normalizedQuery);
      });
      const failed = settled.filter((result) => result.status === 'rejected').length;

      return serialize(query, kind, results, failed ? `${failed} 个内容索引暂时无法读取。` : '');
    },
  }, { signal: controller.signal }).catch(() => {
    controller.abort();
    delete window.__concitechWebMCP;
  });

  window.addEventListener('pagehide', () => controller.abort(), { once: true });
}
