// Person list stored person objects
var personList = [];

// Keep track of total number of people that have been added
var numPeople = 0;

// Add selectable list box and button to DOM
var listNode = document.createElement('div');
var preNode = document.getElementsByClassName('debug')[0];
listNode.innerHTML = '<select multiple name="people"></select><button id="removeBtn">Remove</button>';
preNode.parentNode.insertBefore(listNode,preNode);
var peopleBox = document.getElementsByName('people')[0];

// Add add/submit button click listener
var buttonList = document.getElementsByTagName('button');

for (var i = 0; i < buttonList.length;i++)
  {
    if (buttonList[i].className === 'add')
      {
        buttonList[i].addEventListener('click',addBtnClick);
      }
    else if (buttonList[i].id === 'removeBtn')
      {
        buttonList[i].addEventListener('click',removeBtnClick);
      }
    else
      {
        buttonList[i].addEventListener('click',submitBtnClick);
      }
  }

// Validate age and relationship on add button click
function addBtnClick(event) {
  
  var age = Number(document.getElementsByName('age')[0].value);
  var relationship = document.getElementsByName('rel')[0].value;
  var isSmoker = document.getElementsByName('smoker')[0].checked;
  var isValidInput = true;
  
  // Check age is valid integer greater than 0
  if (Number.isInteger(age) === false || age < 1)
    {
      isValidInput = false;
      alert('Please enter a valid age greater than 0.');
    }
  
  //  Check the relationship value is selected
  if (relationship.length === 0 )
    {
      isValidInput = false;
      alert('Please select a relationship.');
    }
  
  // Add person object to list and list box if valid input
  if (isValidInput)
    {
      personList.push({
        age : age,
        relationship : relationship,
        smoker : isSmoker
      });
      
      // Create person option with formatted info and add to select
      var smokerStr = isSmoker ? 'Yes' : 'No';
      var node = document.createElement('option');
      node.id = 'p' + numPeople;
      node.innerHTML = 'Person ' + numPeople + ' - Age: ' + age +
          ', Relationship: ' + relationship + ', Smoker: ' + smokerStr;
      peopleBox.appendChild(node);
      numPeople++;
    }
  
  event.preventDefault();
}

// Remove person from list box and list array if valid person selected
function removeBtnClick(event) {
  
  var selIndex = peopleBox.selectedIndex;
  
  if (selIndex < 0)
    {
      alert("Please select a person to remove.");    
    }
  else
    {
      peopleBox.remove(selIndex);
      personList.splice(selIndex,1);
    }
  
  event.preventDefault();
}

// Serialize the person list on submit and add to pre element and display
function submitBtnClick(event) {
  var serializedList = JSON.stringify(personList);
  preNode.innerHTML = serializedList;
  preNode.style.display = 'inherit';
  preNode.style.overflow = 'auto';
  event.preventDefault();
}