import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { attachConsoleGuard } from './_helpers/consoleGuard.js';

async function tryClick(locator, opts = {}) {
  try {
    await locator.click({ timeout: 1500, ...opts });
    return true;
  } catch {
    return false;
  }
}

function writeMetrics(metrics) {
  const outDir = path.resolve(process.cwd(), '../output/playwright');
  const outFile = path.join(outDir, 'metrics.json');

  fs.mkdirSync(outDir, { recursive: true });

  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }

  existing.push(metrics);
  fs.writeFileSync(outFile, JSON.stringify(existing, null, 2));
}

test('teacher creates a class; student joins and chats (metrics)', async ({ page, browser }) => {
  test.setTimeout(180_000);

  const assertNoConsoleErrors = attachConsoleGuard(page);

  const id = Date.now();
  const teacherEmail = `teacher_${id}@example.com`;
  const teacherPassword = 'Passw0rd!123';
  const classDisplayName = '7 A French';

  // Teacher signup
  await page.goto('/signup');
  await page.getByPlaceholder('First Name').fill('Test');
  await page.getByPlaceholder('Middle Name (optional)').fill('');
  await page.getByPlaceholder('Last Name').fill('Teacher');
  await page.getByPlaceholder('Email').fill(teacherEmail);
  await page.locator('input[placeholder="Password"]').first().fill(teacherPassword);
  await page.locator('input[placeholder="Confirm Password"]').fill(teacherPassword);
  if (!(await tryClick(page.getByTestId('signup-submit')))) {
    await page.getByRole('button', { name: /Sign Up/i }).click();
  }

  await expect(page.getByRole('heading', { name: /Teacher Dashboard/i })).toBeVisible();

  // Create class
  if (!(await tryClick(page.getByTestId('create-class-open')))) {
    await page.getByRole('button', { name: /\+ New/ }).click();
  }
  await page.getByPlaceholder('e.g., 7').fill('7');
  await page.getByPlaceholder('e.g., Red or A or 1').fill('A');
  await page.getByPlaceholder('e.g., Spanish or French').fill('French');
  if (!(await tryClick(page.getByTestId('create-class-submit')))) {
    await page.getByRole('button', { name: 'Create' }).click();
  }

  await expect(page.getByText(classDisplayName).first()).toBeVisible();
  await page.getByText(classDisplayName).first().click();

  const codeText = await page.getByText(/Code:\s*[A-Z0-9]{6}/).textContent();
  const match = codeText?.match(/Code:\s*([A-Z0-9]{6})/);
  expect(match, 'class code should be visible').not.toBeNull();
  const classCode = match[1];

  // Student joins
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();

  const studentEmail = `student_${id}@example.com`;
  const studentPassword = 'Stud3nt!123';

  const tJoinStart = Date.now();

  await studentPage.goto(`/join/${classCode}`);
  await studentPage.getByPlaceholder('First Name').fill('Test');
  await studentPage.getByPlaceholder('Middle Name (optional)').fill('');
  await studentPage.getByPlaceholder('Last Name').fill('Student');
  await studentPage.getByPlaceholder('Email').fill(studentEmail);
  await studentPage.locator('input[placeholder="Password"]').first().fill(studentPassword);
  await studentPage.locator('input[placeholder="Confirm Password"]').fill(studentPassword);

  const tJoinClick = Date.now();
  if (!(await tryClick(studentPage.getByTestId('join-submit')))) {
    await studentPage.getByRole('button', { name: /Join Class|Join/i }).click();
  }

  // Old UI uses an H1; new UI uses a non-heading title in the topbar.
  await expect(studentPage.getByText(/Practice Chat/i).first()).toBeVisible();
  await expect(studentPage.getByTestId('chat-input')).toBeVisible();
  await expect(studentPage.getByTestId('chat-connection-status')).toHaveText(/Connected/i, {
    timeout: 30_000,
  });

  const tChatVisible = Date.now();
  const tConnected = tChatVisible;

  // Student chats
  const message = `Bonjour ${id}`;
  await studentPage.getByTestId('chat-input').fill(message);

  const tSendClick = Date.now();
  await studentPage.getByTestId('chat-send').click();

  await expect(studentPage.getByText(message)).toBeVisible({ timeout: 60_000 });
  const tStudentEcho = Date.now();

  // AI message should arrive even without OPENAI_API_KEY (fallback response)
  await expect(studentPage.getByText(/AI Assistant/i)).toBeVisible({ timeout: 60_000 });
  const tAiVisible = Date.now();

  // Assessment/metrics should appear after the student message is processed
  await expect(studentPage.getByText(/Target Language:|Target:/i)).toBeVisible({ timeout: 60_000 });

  // Teacher chat viewer should be able to load the real conversation on the Studio UI.
  await page.reload();
  await expect(page.getByText(classDisplayName).first()).toBeVisible();
  await page.getByText(classDisplayName).first().click();
  await expect(page.getByText(/Test Student/)).toBeVisible();

  if (!(await tryClick(page.getByTestId('view-chat')))) {
    await page.getByRole('button', { name: 'View Chat' }).click();
  }

  await expect(page.getByText(/Chat with Test Student/i)).toBeVisible();
  const studioViewer = page.getByTestId('teacher-chat-viewer');
  if (await studioViewer.count()) {
    await expect(studioViewer.getByText(message)).toBeVisible({ timeout: 30_000 });
  } else {
    // Legacy UI uses mock messages; still validate modal opens.
    await expect(page.getByText(/want/i).first()).toBeVisible();
  }

  writeMetrics({
    timestamp: new Date().toISOString(),
    scenario: 'teacher-student-chat',
    class_code: classCode,
    time_to_join_page_ms: tJoinClick - tJoinStart,
    time_to_chat_ui_ms: tChatVisible - tJoinClick,
    time_to_socket_connected_ms: tConnected - tJoinClick,
    time_to_student_echo_ms: tStudentEcho - tSendClick,
    time_to_ai_message_ms: tAiVisible - tSendClick,
  });

  assertNoConsoleErrors();
});
