const puppeteer = require('puppeteer')
const prompt = require('prompt-sync')()

const validateEmail = (email) =>
  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    email
  )

;(async () => {
  const email = prompt('Email: ')

  if (!email || !validateEmail(email)) {
    console.log('Invalid Email!')
    return
  }

  const password = prompt('Password: ')

  if (!password) {
    console.log('Invalid password!')
    return
  }

  if (!password) return

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
  })

  const [page] = await browser.pages()
  await page.goto('https://conta.olx.com.br/anuncios/publicados', {
    waitUntil: 'networkidle0',
  })
  await page.waitForSelector('.cookie-notice-ok-button')
  await page.click('.cookie-notice-ok-button')
  await page.waitForSelector('input[type="email"]')
  await page.click(`input[type="email"]`)
  await page.keyboard.type(email)
  await page.waitForSelector('input[type="password"]')
  await page.click('input[type="password"]')
  await page.keyboard.type(password)
  await page.waitForSelector('.kgGtxX')
  await page.click('.kgGtxX')

  const hrefs = []

  while (true) {
    await page.waitForSelector('.bVmLUh')
    const data = await page.evaluate(() => {
      const products = []
      document.querySelectorAll('.fLZOit').forEach((element) => {
        products.push(element.href)
      })
      const nextPage = document.querySelectorAll('.bVmLUh')
      const hasNextPage =
        nextPage.length > 0 && nextPage[0].textContent.includes('próxima')
      return { products, hasNextPage }
    })

    hrefs.push(...data.products)

    if (data.hasNextPage) {
      await page.click('.bVmLUh')
      await page.waitForTimeout(1000)
    } else break
  }

  console.log(`${hrefs.length} Announces Found`)

  for (var i = 0; i < hrefs.length; i++) {
    await page.goto(hrefs[i], {
      waitUntil: 'networkidle0',
    })
    console.log(`Publishing ${i + 1}: ${hrefs[i]}`)
    await page.waitForSelector('.ads-form-bottom__publish')
    await page.click('.ads-form-bottom__publish')
    await page.waitForTimeout(5000)
  }

  await browser.close()
})()
