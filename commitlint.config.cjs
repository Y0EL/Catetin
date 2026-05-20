module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'mobile',
        'api',
        'bot-tg',
        'bot-wa',
        'db',
        'ocr',
        'companion',
        'pdf',
        'auth',
        'deps',
        'config',
        'design',
        'rules',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
  },
}
