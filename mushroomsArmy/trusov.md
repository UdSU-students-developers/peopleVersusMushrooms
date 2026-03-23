в лобби 
реализация log out!
в лобби кнопка начать игру перхеод на экран игры
только через сокеты

server.ts
убрать     showErrorCb: (error: TError) => void = () => { };
доб const { HOST, SOCKET } = CONFIG;
const { REGISTRATIOM, LOGIN } = SOCKET;

privat - единственный источник
в медиаторе(EVENTS):
ERROR: ' ERROR',

ВАЛИДАЦИЯ ПАСВОРДОВ В СЕРВЕРЕ ПРОВОДИТЬ НЕЛЬЗЯ - НАДО В КОМПОНЕНТЕ
АСИНК НЕТ (27)
все валидации вынести отдельно
сонфермпасворд заменить на пасворд репит 

111 return;
113 this.mediator.call(ERROR, response.error) //else убрать

iscoonect убрать

86 (!user){
    this.mediator.call(ERROR, {})
}

форму убрать


app
props удалить
28 - 29 удалить
использовать контекст
import React, {createContext} from

export const MediatorContext = createContext<Mediator>(null!)
export const ServerContext = createContext<Server>(null!)

validateLogin использовать в регистрации - это правильно

login
userLoggetInHandler - изменть название
31 все засрал server, setPage не меняются  поэтому не нужны
26 mediator.subscribe(ERROR, errorHandler);

изменили:
server
app
login
types
mediator
useMediator
config ?
index

дубинкой побить фронтов

сокеты отличются тем что созд соед между клиентом и сервером, поэтому сервер м послать клиент сообщ (двусторонняя связь), ни тот ни другой не обязаны отвечать на запрос

emit запрос в сервер

в медиатор
useMediator.ts 

в сервисы
index.ts

useState - useRef


client
User
getSelf

UserManager
сокеты переносим в пользователя

в метод регистрации надо 3 параметра передавать пасвордрепит

в конфиге?

в сервере
медиатор - !источник данных и в беке тоже
пользователь будем брать по его guid (GET_USER_BY_GUID)
должно быть единообразно (триггер - триггер)

др менеджеры любой запрос в сокете б записан guid

git status (не пушить, но комитить) - проверить статус
(git checout dev                   - переключиться
    git pull origin dev)           - скопировать 
git checkout -b[СВОЯ_ВЕТКА]        - сво ветка   

git add .
git commit .

git pull origin dev
git push origin [СВОЯ_ВЕТКА]


ДЗ: победить ts-ignore
регистрацию прописать на сокета, по кнопочке старт отрисовывать канвас, в сервере сделать папку армия (уровень с апликатион)