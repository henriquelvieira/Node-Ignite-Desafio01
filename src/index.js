const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(400).json({ error: 'User does not exist' });
  }

  request.user = user;

  next();
};


function checkUserAlreadyExists(username) {

  const userAlreadyExists = users.some(user => user.username === username);

  if (userAlreadyExists) return true;
  
  return false
};

app.post('/users', (request, response) => {
  const { username, name } = request.body;

  const userAlreadyExists = checkUserAlreadyExists(username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: 'User already exists' });
  };

  const userData = {
    id: uuidv4(),
    username,
    name,
    todos: []
  };

  users.push(userData);

  return response.json(userData).status(201);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { user } = request;

  return response.json(user.todos).status(200);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todoData = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(todoData);

  return response.status(201).json(todoData);

});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;
  const { title, deadline } = request.body;

  const userTodo = user.todos.find(todo => todo.id === id);
  if (!userTodo) {
    return response.status(404).json({ error: 'Todo does not exist' });
  };

  userTodo.title = title;
  userTodo.deadline = new Date(deadline);

  return response.json(userTodo).status(200);

});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const userTodo = user.todos.find(todo => todo.id === id);
  if (!userTodo) {
    return response.status(404).json({ error: 'Todo does not exist' });
  }

  userTodo.done = true;

  return response.json(userTodo).status(200);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);
  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo does not exist' });
  }

  user.todos.splice(todoIndex, 1);


  return response.status(204).json();
});

module.exports = app;