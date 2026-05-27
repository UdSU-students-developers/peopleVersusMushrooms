Работа с репозиторием peopleVersusMushrooms

Репозиторий: [UdSU-students-developers/peopleVersusMushrooms](https://github.com/UdSU-students-developers/peopleVersusMushrooms)  
Ветка нашей группы: **dev-PIe**  
В репозитории 4 проекта (папки с client/server); мы работаем только в папке **peopleArmy**.

---

## Что делают команды

| Команда | Описание |
|--------|----------|
| `git status` | Показать текущую ветку, изменённые/добавленные/неотслеживаемые файлы. |
| `git checkout <ветка>` | Переключиться на ветку (например `dev-PIe` или `main`). |
| `git checkout -b <ветка>` | Создать новую ветку и сразу переключиться на неё (для задачи/фичи). |
| `git pull origin <ветка>` | Скачать изменения с удалённого репозитория и слить их в текущую ветку. |
| `git add .` | Добавить все изменения в индекс (staging) перед коммитом. |
| `git add <файл/папка>` | Добавить в индекс только указанные файлы или папку. |
| `git commit -m "текст"` | Создать коммит с сообщением. В коммит попадает то, что в индексе после `git add`. |
| `git push origin <ветка>` | Отправить коммиты из локальной ветки в удалённую `origin`. |

---

## Порядок действий

### 1. Скопировать проект к себе (первый раз)

Если репозиторий ещё не склонирован:

```bash
# Клонировать репозиторий
git clone https://github.com/UdSU-students-developers/peopleVersusMushrooms.git
cd peopleVersusMushrooms

# Переключиться на ветку нашей группы
git checkout dev

# При необходимости подтянуть последние изменения с GitHub
git pull origin dev
```

Дальше работаете в папке `peopleArmy` (client и server).

---

### 2. Отдельная ветка для изменений (основной порядок)

Все изменения делаете в **отдельной ветке** (например `feature/registration` или `fix/answer-bad`). Так проще делать код-ревью и откатывать одну задачу, не трогая остальное.

```bash
# 1. Переключиться на ветку группы и подтянуть последнее
git checkout dev
git pull origin dev

# 2. Создать новую ветку от dev-PIe и переключиться на неё
git checkout -b feature/название-задачи
# Примеры имён: feature/registration, fix/mediator-typo, docs/readme

# 3. Делать правки в peopleArmy, затем проверить список изменений
git status

# 4. Добавить изменения в индекс
git add .
# или только папку проекта:  git add peopleArmy/

# 5. Закоммитить с понятным сообщением
git commit -m "Краткое описание: что сделано"

# 6. Подтянуть актуальную dev-PIe в свою ветку (на случай чужих коммитов)
git pull origin dev

# 7. Отправить свою ветку на GitHub
git push origin feature/название-задачи
```

На GitHub: **Pull request** из ветки `feature/название-задачи` в `dev`. После мержа в `dev` можно удалить ветку задачи и снова переключиться на `dev`:

```bash
git checkout dev
git pull origin dev
```

---

### 3. Начали работать в dev-PIe, не создав отдельную ветку

Если вы делали коммиты сразу в локальной ветке **dev**, пушить в неё нельзя (на репозитории включена защита: изменения только через Pull Request). Коммиты переделывать не нужно — достаточно перенести их в новую ветку и запушить её.

```bash
# 1. Создать новую ветку от текущего состояния (все ваши коммиты останутся в ней)
git checkout -b feature/ваше-название
# Примеры: feature/peoplearmy-update, feature/registration

# 2. Отправить эту ветку на GitHub
git push origin feature/ваше-название

# 3. На GitHub открыть Pull Request: ветка feature/ваше-название → dev-PIe
```

После мержа PR на GitHub можно переключиться обратно на dev-PIe и подтянуть обновления:

```bash
git checkout dev
git pull origin dev
```

---

### 4. Короткая шпаргалка (рабочий процесс через отдельную ветку)

```text
git checkout dev
git pull origin dev
git checkout -b PIE-имя-задачи
# … правки в peopleArmy …
git add .
git commit -m "описание изменений"
git pull origin dev
git push origin PIE-имя-задачи
```

Дальше на GitHub: **Pull Request** из `PIE-имя-задачи` в `dev`.

---

## Важно

- В **dev-PIe** нельзя пушить напрямую — только через Pull Request из отдельной ветки.  
- Не коммитьте и не пушите изменения в чужие папки (**mushroomsArmy**, **mushroomsEconomy**, **peopleEconomy**).  
- Перед пушем своей ветки делайте `git pull origin dev`, чтобы подтянуть чужие изменения и уменьшить конфликты.  
- Сообщения коммитов пишите по делу: что сделано или исправлено (например: «Добавлена регистрация через медиатор», «Исправлен Answer.bad в хендлерах»).
