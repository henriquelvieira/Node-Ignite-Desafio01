const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate: isValidUUID } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];


function validUserByName(request, response){
  const { username } = request.headers;

  if (!username) {
    return response.status(404).json({ error: 'Username is required' });
  };

  const user = users.find(user => user.username === username);

  return user;
};

function checksExistsUserAccount(request, response, next) {

  const user = validUserByName(request, response);
  if (!user) {
    return response.status(404).json({ error: 'User does not exist' });
  }
  
  request.user = user;

  next();
};

function checksCreateTodosUserAvailability(request, response, next) {
  const { user } = request;

  if (!user.pro && user.todos.length > 9){
    return response.status(403).json({ error: 'Limit of Todos exceeded' });
  }

  next();
};

function checksTodoExists(request, response, next) {
  const { id } = request.params;

  const isValidaID = isValidUUID(id);

  if (!isValidaID) {
    return response.status(400).json({ error: 'Invalid ID' });
  };

  const userData = validUserByName(request, response);
  if (!userData) {
    return response.status(404).json({ error: 'User does not exist' });
  };


  const userTodo = userData.todos.find(todo => todo.id === id);
  if (!userTodo) {
    return response.status(404).json({ error: 'Todo does not exist' });
  };
  
  request.user = userData;
  request.todo = userTodo;

  next();
};

function findUserById(request, response, next) {
  const { id } = request.params;

  const user = users.find(user => user.id === id); 

  if (!user) {
    return response.status(404).json({ error: 'User does not exist' });
  };

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

  const newUser = {
    id: uuidv4(),
    username,
    name,
    pro: false,
    todos: []
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch('/users/:id/pro', findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response.status(400).json({ error: 'Pro plan is already activated.' });
  }

  user.pro = true;

  return response.json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  const { user } = request;

  return response.json(user.todos).status(200);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTODO = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(newTODO);

  return response.status(201).json(newTODO);

});

app.put('/todos/:id', checksTodoExists, (request, response) => {
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

app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const userTodo = user.todos.find(todo => todo.id === id);
  if (!userTodo) {
    return response.status(404).json({ error: 'Todo does not exist' });
  }

  userTodo.done = true;

  return response.json(userTodo).status(200);
});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);
  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo does not exist' });
  }

  user.todos.splice(todoIndex, 1);


  return response.status(204).json();
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};