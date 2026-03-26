export const languages = {
  en: { name: 'English 🇬🇧 / 🇺🇸', code: 'en' },
  ru: { name: 'Русский 🇷🇺', code: 'ru' },
  es: { name: 'Español (Spanish) 🇪🇸', code: 'es' },
  fr: { name: 'Français (French) 🇫🇷', code: 'fr' },
  de: { name: 'Deutsch (German) 🇩🇪', code: 'de' },
  it: { name: 'Italiano (Italian) 🇮🇹', code: 'it' },
  pt: { name: 'Português 🇵🇹 / 🇧🇷', code: 'pt' },
  nl: { name: 'Nederlands (Dutch) 🇳🇱', code: 'nl' },
  pl: { name: 'Polski (Polish) 🇵🇱', code: 'pl' },
  sv: { name: 'Svenska (Swedish) 🇸🇪', code: 'sv' }
};

export const translations = {
  en: {
    login: 'Login',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    server: 'Server',
    main_server: 'Main Server',
    local_server: 'Local Server',
    custom_server: 'Custom Server',
    custom_url: 'Custom URL',
    proxy: 'Proxy Server',
    proxy_unavailable_local: 'Unavailable on local server',
    proxy_unavailable_norm: 'Unavailable. Buy NORM subscription to unlock.',
    proxy_host: 'Proxy Host',
    proxy_port: 'Proxy Port',
    proxy_user: 'Login (Optional)',
    proxy_pass: 'Password (Optional)',
    language: 'Language',
    save: 'Save',
    profile: 'Profile',
    nickname: 'Nickname',
    avatar: 'Avatar',
    upload_avatar: 'Upload Avatar',
    remove_avatar: 'Remove Avatar',
    norm_status: 'NORM Subscription Status',
    free: 'FREE',
    norm: 'NORM (Active)',
    buy_norm: 'Upgrade to NORM',
    settings: 'Settings',
    close: 'Close',
    appearance: 'Appearance & Language',
    network: 'Network Settings'
  },
  ru: {
    login: 'Войти',
    register: 'Регистрация',
    username: 'Имя пользователя',
    password: 'Пароль',
    server: 'Сервер',
    main_server: 'Основной сервер',
    local_server: 'Локальный сервер',
    custom_server: 'Свой сервер',
    custom_url: 'URL сервера',
    proxy: 'Прокси сервер',
    proxy_unavailable_local: 'Недоступно на локальном сервере',
    proxy_unavailable_norm: 'Недоступно, купите подписку NORM для расширения возможностей',
    proxy_host: 'Адрес прокси',
    proxy_port: 'Порт',
    proxy_user: 'Логин (необязательно)',
    proxy_pass: 'Пароль (необязательно)',
    language: 'Язык',
    save: 'Сохранить',
    profile: 'Профиль',
    nickname: 'Никнейм',
    avatar: 'Аватар',
    upload_avatar: 'Загрузить аватар',
    remove_avatar: 'Удалить аватар',
    norm_status: 'Статус подписки NORM',
    free: 'БАЗОВАЯ (FREE)',
    norm: 'NORM (Активна)',
    buy_norm: 'Купить подписку NORM',
    settings: 'Настройки',
    close: 'Закрыть',
    appearance: 'Внешний вид и язык',
    network: 'Настройки сети'
  }
};

// Fallback logic for undefined translations
export const t = (lang: string, key: string) => {
  const dictionary = translations[lang as keyof typeof translations] || translations.ru;
  return dictionary[key as keyof typeof dictionary] || translations.en[key as keyof typeof translations.en] || key;
};
