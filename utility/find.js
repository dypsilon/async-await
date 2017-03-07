// a simple utility function for finding objects by property in a storage
// it will either return the object or throw an error if it was not found
module.exports = function find(collection, property, value) {
  for (let i=0; i < collection.length; i++) {
    if (collection[i][property] == value) {
      return collection[i];
    }
  }

  throw new Error('The object was not found in the collection.');
}
