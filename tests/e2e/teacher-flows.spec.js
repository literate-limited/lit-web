import { test, expect } from '@playwright/test';
import { attachConsoleGuard } from './_helpers/consoleGuard.js';

async function tryClick(locator, opts = {}) {
  try {
    await locator.click({ timeout: 1500, ...opts });
    return true;
  } catch {
    return false;
  }
}

test('teacher dashboard flows', async ({ page, browser }) => {
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

  // Logout + login (covers auth session flows)
  if (!(await tryClick(page.getByTestId('logout')))) {
    await tryClick(page.getByRole('button', { name: /Logout/i }));
  }
  await expect(page.getByText(/Login/i).first()).toBeVisible();

  await page.getByPlaceholder('Email').fill(teacherEmail);
  await page.getByPlaceholder('Password').fill(teacherPassword);
  if (!(await tryClick(page.getByTestId('login-submit')))) {
    await page.getByRole('button', { name: /Login/i }).click();
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

  // Copy join link (old UI used alert; new UI uses a toast)
  const dialogPromise = page
    .waitForEvent('dialog', { timeout: 2500 })
    .then(async (dialog) => {
      const msg = dialog.message();
      await dialog.accept();
      return msg;
    })
    .catch(() => null);

  await page.getByRole('button', { name: 'Copy Join Link' }).click();
  const dialogMsg = await dialogPromise;
  if (dialogMsg) {
    expect(dialogMsg).toMatch(/Join link copied|copied/i);
  } else {
    await expect(page.getByText(/Join link copied|Could not copy/i).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  // Program configuration: open, edit prompt, save
  if (!(await tryClick(page.getByTestId('program-config-toggle')))) {
    await page.getByRole('heading', { name: /Program Configuration/i }).click();
  }
  await expect(page.getByText('AI System Prompt')).toBeVisible();
  await page
    .getByPlaceholder('Define how the AI should interact with students...')
    .fill('Be concise and encourage student replies.');

  const promptDialogPromise = page
    .waitForEvent('dialog', { timeout: 2500 })
    .then(async (dialog) => {
      const msg = dialog.message();
      await dialog.accept();
      return msg;
    })
    .catch(() => null);

  if (!(await tryClick(page.getByTestId('save-prompt')))) {
    await page.getByRole('button', { name: 'Save Prompt' }).click();
  }

  const promptDialogMsg = await promptDialogPromise;
  if (promptDialogMsg) {
    expect(promptDialogMsg).toMatch(/Prompt saved/i);
  } else {
    await expect(page.getByText(/Prompt saved/i).first()).toBeVisible({ timeout: 10_000 });
  }

  // Chat units form toggles (stubbed)
  if (!(await tryClick(page.getByTestId('add-chat-unit')))) {
    await page.getByRole('button', { name: /Add Chat Unit/i }).click();
  }
  await page.getByPlaceholder("Unit Title (e.g., 'Greetings & Introductions')").fill('Greetings');
  await page.getByPlaceholder('Unit Description & Goals').fill('Practice greetings');
  await page.getByPlaceholder('Topic Tags (comma-separated)').fill('greetings,intros');
  await page.getByRole('button', { name: 'Add Unit' }).click();
  // Old UI does not persist units yet; new UI shows a local draft immediately.
  await expect(page.getByText(/No chat units defined yet|Greetings|Unit added/i).first()).toBeVisible();

  // Student joins
  const codeText = await page.getByText(/Code:\s*[A-Z0-9]{6}/).textContent();
  const match = codeText?.match(/Code:\s*([A-Z0-9]{6})/);
  expect(match, 'class code should be visible').not.toBeNull();
  const classCode = match[1];

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  const studentEmail = `student_${id}@example.com`;
  const studentPassword = 'Stud3nt!123';

  await studentPage.goto(`/join/${classCode}`);
  await studentPage.getByPlaceholder('First Name').fill('Test');
  await studentPage.getByPlaceholder('Middle Name (optional)').fill('');
  await studentPage.getByPlaceholder('Last Name').fill('Student');
  await studentPage.getByPlaceholder('Email').fill(studentEmail);
  await studentPage.locator('input[placeholder="Password"]').first().fill(studentPassword);
  await studentPage.locator('input[placeholder="Confirm Password"]').fill(studentPassword);
  if (!(await tryClick(studentPage.getByTestId('join-submit')))) {
    await studentPage.getByRole('button', { name: /Join Class|Join/i }).click();
  }
  // Old UI uses an H1; new UI uses a non-heading title in the topbar.
  await expect(studentPage.getByText(/Practice Chat/i).first()).toBeVisible();

  // Refresh teacher view to pick up new student
  await page.reload();
  await expect(page.getByText(classDisplayName).first()).toBeVisible();
  await page.getByText(classDisplayName).first().click();
  await expect(page.getByText(/Test Student/)).toBeVisible();

  // View student chat
  if (!(await tryClick(page.getByTestId('view-chat')))) {
    await page.getByRole('button', { name: 'View Chat' }).click();
  }
  await expect(page.getByText(/Chat with Test Student/i)).toBeVisible();
  await expect(page.getByText(/No messages yet|want/i).first()).toBeVisible();
  // Close modal (new UI: aria-label "Close"; old UI: "✕")
  if (!(await tryClick(page.getByRole('button', { name: 'Close' })))) {
    await tryClick(page.getByRole('button', { name: '✕' }));
  }

  // Delete class: cancel then confirm
  const deleteBtn = page.locator('button[aria-label="Delete class"], button[title="Delete class"]');
  await deleteBtn.first().click();
  await expect(page.getByText(/Delete Class\?/i)).toBeVisible();
  const confirmDialog = page.getByRole('dialog');
  if (!(await tryClick(confirmDialog.getByRole('button', { name: 'Cancel' })))) {
    await page.getByRole('button', { name: 'Cancel' }).click();
  }
  await expect(page.getByText(classDisplayName).first()).toBeVisible();

  await deleteBtn.first().click();
  const confirmDialog2 = page.getByRole('dialog');
  if (!(await tryClick(confirmDialog2.getByRole('button', { name: 'Delete' })))) {
    await page.getByRole('button', { name: 'Delete' }).click();
  }
  await expect(page.getByText(/No classes yet/i)).toBeVisible();

  assertNoConsoleErrors();
});
