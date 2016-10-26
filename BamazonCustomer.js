var inquirer = require('inquirer');
var mySQL = require('mySQL');
var connection = mySQL.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Guitar01',
  database: 'bamazon',
});

var productList = [];

connection.connect(function(err) {
  if(err) throw err;
  console.log('Connected as ID ' + connection.threadId)
});

connection.query('SELECT * FROM products ORDER BY products.ItemID', function(err, res){
  if (err) throw err;
  console.log("What would you like to purchase?")
  console.log("--------------------------------------------------------------");
  for (var i = 0; i < res.length; i++){
    console.log('Product ID: '+res[i].ItemID+" | "+res[i].ProductName+" | $"+res[i].Price);
    productList.push(res[i].ProductName);
  }
  console.log("--------------------------------------------------------------");
  customerPrompt();
});

var customerPrompt = function(){
  inquirer.prompt({
      type: 'list',
      name: 'options',
      message: 'Please choose.',
      choices: ['View Products','Quit']
    }).then(function(user){
      switch (user.options){
        case 'View Products':
          purchase();
        break;

        case 'Quit':
          connection.end();
        break;

        default:
          console.log("Error");
      };
    });
};

var purchase = function(){
  inquirer.prompt([
  {
    type: 'list',
    name: 'product',
    message: "What would you like to purchase?",
    choices: productList
  },
  {
    type: 'input',
    name: 'amount',
    message: 'Quantity?',
    validate: function(value) {
      if (isNaN(value) == true || value == null) {
        console.log('Error. Not a valid number.');
        return false;
      }
      return true;
    }
  }

  ]).then(function(user){
    connection.query('SELECT * FROM products INNER JOIN DepartmentName'+
            ' WHERE (products.ProductName = ?)', user.product, function(err,res){
      if (err) throw err;
      if (user.amount > (res[0].StockQuantity - user.amount)) {
        console.log('Not enough in stock.\n')
        purchase();
      } else {
        console.log('You ordered: '+user.amount+' '+user.product+'(s) at $'+res[0].Price+'\n');
        console.log('Your total: $'+(res[0].Price*user.amount)+'\n');
        connection.query('UPDATE products SET StockQuantity = "'+(res[0].StockQuantity - user.amount)+'" WHERE ProductName = "'+user.product+'"');
        connection.query('UPDATE departments SET TotalSales = "'+(res[0].TotalSales + (res[0].Price*user.amount))+'" WHERE DepartmentName = "'+res[0].DepartmentName+'"')
      }
      customerPrompt();
    });
  });
 }

var exit = function(){
  inquirer.prompt({
    type: 'list',
    name: 'quit',
    message: 'Would you like to quit?',
    choices:['Yes','No']
  }).then(function(user){
    if (user.quit == 'Yes') {
      connection.end();     
    } else {
      purchase();
    };
  });
};

