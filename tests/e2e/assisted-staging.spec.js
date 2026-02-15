import { test, expect } from '@playwright/test';

async function tryClick(locator, opts = {}) {
  try {
    await locator.click({ timeout: 1500, ...opts });
    return true;
  } catch {
    return false;
  }
}

async function requireFilled(locator, label) {
  const v = await locator.inputValue().catch(() => '');
  expect(v, `${label} must be filled before resuming`).toBeTruthy();
}

test.describe('@assist staging assisted flows', () => {
  test('teacher + student end-to-end (pause for passwords)', async ({ page, browser }) => {
    test.setTimeout(240_000);

    if (!/^(1|true)$/i.test(process.env.PW_ASSIST || '')) {
      test.skip(true, 'Set PW_ASSIST=1 to run assisted staging flows.');
    }

    const id = Date.now();
    const teacherEmail = `teacher_${id}@example.com`;
    const studentEmail = `student_${id}@example.com`;
    const classDisplayName = '7 A French';

    // Teacher signup (pause at password fields)
    await page.goto('/signup');
    await page.getByPlaceholder('First Name').fill('Test');
    await page.getByPlaceholder('Middle Name (optional)').fill('');
    await page.getByPlaceholder('Last Name').fill('Teacher');
    await page.getByPlaceholder('Email').fill(teacherEmail);

    const teacherPw = page.locator('input[placeholder="Password"]').first();
    const teacherPwConfirm = page.locator('input[placeholder="Confirm Password"]').first();
    await teacherPw.click();

    // Operator-assisted: type the password in both fields, then click "Resume" in the inspector.
    // The test will continue and click submit for you.
    await page.pause();

    await requireFilled(teacherPw, 'Teacher password');
    await requireFilled(teacherPwConfirm, 'Teacher confirm password');

    await page.getByTestId('signup-submit').click();
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

    // Student joins (pause at password fields)
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    await studentPage.goto(`/join/${classCode}`);
    await studentPage.getByPlaceholder('First Name').fill('Test');
    await studentPage.getByPlaceholder('Middle Name (optional)').fill('');
    await studentPage.getByPlaceholder('Last Name').fill('Student');
    await studentPage.getByPlaceholder('Email').fill(studentEmail);

    const studentPw = studentPage.locator('input[placeholder="Password"]').first();
    const studentPwConfirm = studentPage
      .locator('input[placeholder="Confirm Password"]')
      .first();
    await studentPw.click();

    await studentPage.pause();

    await requireFilled(studentPw, 'Student password');
    await requireFilled(studentPwConfirm, 'Student confirm password');

    await studentPage.getByTestId('join-submit').click();
    await expect(studentPage.getByText(/Practice Chat/i).first()).toBeVisible();

    // Student chats
    await expect(studentPage.getByTestId('chat-input')).toBeVisible({ timeout: 60_000 });
    const message = `Bonjour ${id}`;
    await studentPage.getByTestId('chat-input').fill(message);
    await studentPage.getByTestId('chat-send').click();
    await expect(studentPage.getByText(message)).toBeVisible({ timeout: 60_000 });

    // AI message should arrive (even without OPENAI_API_KEY, fallback response is expected)
    await expect(studentPage.getByText(/AI Assistant/i)).toBeVisible({ timeout: 60_000 });

    // Teacher sees student and can open chat viewer
    await page.reload();
    await expect(page.getByText(classDisplayName).first()).toBeVisible();
    await page.getByText(classDisplayName).first().click();
    await expect(page.getByText(/Test Student/)).toBeVisible({ timeout: 60_000 });

    if (!(await tryClick(page.getByTestId('view-chat')))) {
      await page.getByRole('button', { name: 'View Chat' }).click();
    }
    await expect(page.getByText(/Chat with Test Student/i)).toBeVisible();
    const studioViewer = page.getByTestId('teacher-chat-viewer');
    if (await studioViewer.count()) {
      await expect(studioViewer.getByText(message)).toBeVisible({ timeout: 30_000 });
    }
  });
});

