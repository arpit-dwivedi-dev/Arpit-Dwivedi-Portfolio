import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

describe('Portfolio App Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should load the app and display the navbar', async () => {
    await page.goto('http://localhost:3000/Arpit-Dwivedi-Portfolio/');
    await page.waitForSelector('nav');
    const navbar = await page.$('nav');
    expect(navbar).not.toBeNull();
  });

  test('should display the hero section', async () => {
    await page.goto('http://localhost:3000/Arpit-Dwivedi-Portfolio/');
    await page.waitForSelector('#home');
    const hero = await page.$('#home');
    expect(hero).not.toBeNull();
  });

  test('should display the featured project section', async () => {
    await page.goto('http://localhost:3000/Arpit-Dwivedi-Portfolio/');
    await page.waitForSelector('#projects');
    const featuredProject = await page.$('#projects');
    expect(featuredProject).not.toBeNull();
  });

  test('should display the about section', async () => {
    await page.goto('http://localhost:3000/Arpit-Dwivedi-Portfolio/');
    await page.waitForSelector('#about');
    const about = await page.$('#about');
    expect(about).not.toBeNull();
  });

  test('should display the tech stack section', async () => {
    await page.goto('http://localhost:3000/Arpit-Dwivedi-Portfolio/');
    // Wait for the TechStack section to be visible by looking for its heading
    await page.waitForSelector('text=Tech Stack');
    const techStackSection = await page.$('text=Tech Stack');
    expect(techStackSection).not.toBeNull();
  });

  test('should navigate to the about section when clicking the about dot', async () => {
    await page.goto('http://localhost:3000/Arpit-Dwivedi-Portfolio/');
    await page.waitForSelector('a[href="#about"]');
    const aboutDot = await page.$('a[href="#about"]');
    if (aboutDot) {
      await aboutDot.click();
      // Wait for URL to update instead of waiting for navigation
      await page.waitForFunction(() => globalThis.location.hash.includes('about'));
      const url = page.url();
      expect(url).toContain('#about');
    }
  });

  test('should have a working contact form (if present)', async () => {
    await page.goto('http://localhost:3000/Arpit-Dwivedi-Portfolio/');
    await page.waitForSelector('#contact');
    const contactSection = await page.$('#contact');
    expect(contactSection).not.toBeNull();
    if (!contactSection) return;

    const form = await contactSection.$('form');
    if (!form) return;

    const nameInput = await form.$('input[placeholder="Your Name"]');
    const emailInput = await form.$('input[placeholder="your@email.com"]');
    const messageInput = await form.$('textarea[placeholder="Tell me about your project..."]');
    expect(nameInput).not.toBeNull();
    expect(emailInput).not.toBeNull();
    expect(messageInput).not.toBeNull();

    const submitButton = await form.$('button[type="submit"]');
    if (submitButton) {
      const buttonText = await page.evaluate(el => el.textContent, submitButton);
      expect(buttonText).toContain('Send Message');
      return;
    }

    const buttons = await form.$$('button');
    const buttonTexts = await Promise.all(buttons.map(button => page.evaluate(el => el.textContent, button)));
    const found = buttonTexts.some(text => text?.includes('Send Message'));
    expect(found).toBe(true);
  });
});
