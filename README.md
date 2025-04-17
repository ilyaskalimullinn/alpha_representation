# Альфа-представления для подсчета количества раскрасок Тейта

## Запуск

В будущем, возможно, добавлю докер-контейнер. Пока что в режиме `dev` нужно поставить виртуальное окружение и захостить
через `uvicorn`.

1. Создать виртуалку

```shell
python -m venv .venv
```

2. Активировать виртуалку

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
