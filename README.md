# Альфа-представления для подсчета количества раскрасок Тейта

## Запуск

В будущем, возможно, добавлю докер-контейнер. Пока что в режиме `dev` нужно поставить виртуальное окружение и захостить
через `uvicorn`.

### Backend

1. Создать виртуальное окружение

```shell
python -m venv .venv
```

2. Активировать виртуальное окружение

Linux:

```shell
source .venv/bin/activate
```

Windows:

```shell
.\.venv\Scripts\activate
```

3. Установить зависимости

```shell
pip install -r requirements.txt
```

4. Запустить сервер

```shell
uvicorn src.main:app --reload
```

### Frontend

```shell
cd frontend
npm i
```

Далее для билда проекта:

```shell
npm run build
```

Для разработки:

```shell
npm run watch
```
