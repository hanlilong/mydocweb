import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "问题解决文档",
  description: "u8 doc",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
    ],

    sidebar: [
      {
        text: '使用指南',
        items: [
          { text: '快速开始', link: '/docs/getting-started' },
          { text: '配置说明', link: '/config' }
        ]
      }, 
    ],

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: { 
            fuzzy: 0.2, 
            prefix: true, 
            boost: { title: 4, text: 2 } 
          }
        },
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档' },
              modal: { noResultsText: '没有找到相关内容' }
            }
          }
        }
      }
    }
  }
})
