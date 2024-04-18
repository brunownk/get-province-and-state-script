require('dotenv').config()
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Sample JSON array of coordinates
const coordinatesArray = require('./addresses.json');

async function getProvinceAndState(coordinates) {
  try {
    console.log('Loading data...');
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

    const updatedCoordinates = [];

    for (const coord of coordinates) {
      const response = await axios.get(`${baseUrl}?latlng=${coord.latitude},${coord.longitude}&key=${apiKey}`);
      const results = response.data.results;

      // Extract province and state from the response
      let province, state;
      for (const component of results[0].address_components) {
        if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
        }
        if (component.types.includes('administrative_area_level_2')) {
            province = component.long_name;
        }
      }

      // Create new object with province and state added
      const updatedCoord = { ...coord, province, state };
      updatedCoordinates.push(updatedCoord);
    }

    return updatedCoordinates;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
}

async function writeToFile(data) {
  try {
    const outputFolder = path.join(__dirname, 'output');

    // Create the output folder if it doesn't exist
    await fs.mkdir(outputFolder, { recursive: true });

    const files = await fs.readdir(outputFolder);

    const fileCount = files.filter(file => file.endsWith('.json')).length;
    const fileName = !fileCount ? 'result.json' : `result_${fileCount + 1}.json`;
    const outputPath = path.join(outputFolder, fileName);

    await fs.writeFile(outputPath, data);
    console.log(`File '${fileName}' created successfully!`);
  } catch (error) {
    console.error('Error writing file:', error);
  }
}

console.log('Script started...');
getProvinceAndState(coordinatesArray)
  .then(updatedArray => {
    const jsonContent = JSON.stringify(updatedArray, null, 2); // Convert array to JSON string
    writeToFile(jsonContent);
  })
  .catch(error => {
    console.error('Error:', error);
  });
