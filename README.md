# Route Planning Tool

This project is a MVC Tool for finding the shortest path to all the destinations using the google maps API.

## Installation

To run this project locally, follow these steps:

1. Clone the repository to your local machine:

    ```bash
    git clone https://github.com/Divyesh1511/route-planning-tool.git
    ```

2. Navigate to the project directory:

    ```bash
    cd route-planning-tool
    ```

3. Install the required dependencies:

    ```bash
    npm install
    ```

## Usage

1. Before running the project, you need to obtain a Google API key for testing purposes. You can get it from the [Google Developers Console](https://console.developers.google.com/).

2. Once you have obtained the API key, you can enter your own API key to the index.html page in the public folder:

    ```
    https://maps.googleapis.com/maps/api/js?key={YOUR_API_KEY}&libraries=places,geometry&callback=initMap
    ```

    Replace `{YOUR_API_KEY}` with your actual Google API key.

3. Start the server by running the following command:

    ```bash
    npm start
    ```

4. Open your web browser and navigate to `http://localhost:3000` to access the application.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow these guidelines:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

