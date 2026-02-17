const binarySearch = (value, list) => {
  let start = 0;
  let end = list.length - 1;
  let count = 0;

  while (start <= end) {
    count++;
    let mid = Math.floor((start + end) / 2);
    if (list[mid] === value) {
      console.log(`Found! ––– Value: ${list[mid]} ––– Steps: ${count}`);
      return list[mid];
    }

    if (value < list[mid]) {
      end = mid - 1;
    } else {
      start = mid + 1;
    }
  }

  console.log("Not found! ––– Steps: ", count);
  return false;
};

const list = [1, 2, 3, 4, 5, 6, 7, 10];
binarySearch(3, list);
console.log("Theoretical Steps", Math.floor(Math.log2(5)));
