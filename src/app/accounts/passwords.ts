export function accountPasswords(markdown: string) {
  const result = new Map<string, string>();
  let emailColumn = -1, passwordColumn = -1;
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) { emailColumn = -1; passwordColumn = -1; continue; }
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map(s => s.trim().replace(/^`|`$/g, ""));
    const emailHeader = cells.findIndex(s => /^email(?: đăng nhập)?$/i.test(s));
    const passwordHeader = cells.findIndex(s => /^mật khẩu$/i.test(s));
    if (emailHeader >= 0 && passwordHeader >= 0) { emailColumn = emailHeader; passwordColumn = passwordHeader; continue; }
    const email = cells[emailColumn], password = cells[passwordColumn];
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password) result.set(email.toLowerCase(), password);
  }
  return result;
}
