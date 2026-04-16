import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { app } from 'electron'
import { BaseService } from './base.service'

export class PdfService extends BaseService {
  async generatePdf(htmlContent: string, fileName: string): Promise<string> {
    let browser: any = null
    try {
      const puppeteer = require('puppeteer-core')

      // Find system Chrome/Chromium
      const executablePath = this.findChrome()
      if (!executablePath) throw new Error('Chrome/Chromium not found. Please install Google Chrome.')

      browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      })

      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

      const outputDir = path.join(app.getPath('documents'), 'FashionKaGhar')
      fs.mkdirSync(outputDir, { recursive: true })
      const outputPath = path.join(outputDir, fileName)

      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
      })

      return outputPath
    } finally {
      if (browser) await browser.close()
    }
  }

  private findChrome(): string | null {
    const platform = process.platform
    const paths: string[] = []

    if (platform === 'darwin') {
      paths.push(
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        `${os.homedir()}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
      )
    } else if (platform === 'win32') {
      paths.push(
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      )
    } else {
      paths.push('/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium')
    }

    return paths.find((p) => fs.existsSync(p)) ?? null
  }
}
