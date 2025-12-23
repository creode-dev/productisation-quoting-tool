import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar';

const vitePressConfigs = {
  title: "Creode Documentation",
  description: "Documentation for the Creode Agency",
  srcDir: "Documentation",
  outDir: "public/docs",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      
    ]
  },
}

// https://vitepress.dev/reference/site-config
export default defineConfig(
  withSidebar(
    vitePressConfigs, 
    {
      documentRootPath: 'Documentation',
    }
  )
)
