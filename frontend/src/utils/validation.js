/**
 * Проверка данных форм на стороне клиента.
 *
 * Задание 6 требует проверять данные и в браузере, и на сервере.
 * Сервер повторно проверяет всё сам (см. backend/app/schemas), а эти
 * функции дают мгновенную подсказку пользователю без обращения к сети.
 * Правила намеренно совпадают с серверными: пароль не короче 8 символов,
 * корректный e-mail, название привычки не пустое.
 */

/** Регулярное выражение для адреса электронной почты. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Строка, состоящая только из пробелов, считается пустой. */
export function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === ''
}

/** Проверка адреса электронной почты. */
export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value ?? '').trim())
}

/** Проверка формы входа. */
export function validateLogin(values) {
  const errors = {}
  if (isEmpty(values.email)) errors.email = 'Укажите адрес электронной почты'
  else if (!isValidEmail(values.email)) errors.email = 'Некорректный адрес электронной почты'

  if (isEmpty(values.password)) errors.password = 'Введите пароль'
  return errors
}

/** Проверка формы регистрации. */
export function validateRegister(values) {
  const errors = {}

  if (isEmpty(values.username)) errors.username = 'Укажите имя'
  else if (String(values.username).trim().length < 2) errors.username = 'Имя слишком короткое'
  else if (String(values.username).trim().length > 50) errors.username = 'Не более 50 символов'

  if (isEmpty(values.email)) errors.email = 'Укажите адрес электронной почты'
  else if (!isValidEmail(values.email)) errors.email = 'Некорректный адрес электронной почты'

  if (isEmpty(values.password)) errors.password = 'Придумайте пароль'
  else if (String(values.password).length < 8) errors.password = 'Пароль должен содержать не менее 8 символов'
  else if (String(values.password).length > 72) errors.password = 'Пароль не должен быть длиннее 72 символов'

  if (isEmpty(values.passwordConfirm)) errors.passwordConfirm = 'Повторите пароль'
  else if (values.password !== values.passwordConfirm) errors.passwordConfirm = 'Пароли не совпадают'

  return errors
}

/** Проверка формы привычки: создание и редактирование. */
export function validateHabit(values) {
  const errors = {}

  if (isEmpty(values.name)) errors.name = 'Введите название привычки'
  else if (String(values.name).trim().length > 100) errors.name = 'Не более 100 символов'

  if (values.description && String(values.description).length > 500) {
    errors.description = 'Не более 500 символов'
  }

  if (isEmpty(values.category_id)) errors.category_id = 'Выберите категорию'

  // Время напоминания необязательно, но если указано — должно быть ЧЧ:ММ.
  if (!isEmpty(values.reminder_time) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.reminder_time)) {
    errors.reminder_time = 'Укажите время в формате ЧЧ:ММ'
  }

  return errors
}

/** Проверка формы профиля. */
export function validateProfile(values) {
  const errors = {}
  if (isEmpty(values.username)) errors.username = 'Укажите имя'
  else if (String(values.username).trim().length > 50) errors.username = 'Не более 50 символов'
  return errors
}

/** Проверка файла изображения перед загрузкой на сервер. */
export function validateImage(file) {
  if (!file) return 'Выберите файл'
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) return 'Допустимы только JPG, PNG, WebP или GIF'
  if (file.size > 2 * 1024 * 1024) return 'Размер файла не должен превышать 2 МБ'
  return ''
}

/** Есть ли ошибки в объекте, который вернули функции выше. */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}
