# SCREENSHOT INTERFACE REACT WEB

### Login
<img width="1873" height="916" alt="image" src="https://github.com/user-attachments/assets/3d5d09a0-8b04-4f68-bda3-abf4cc3707b2" />

### SignUp
<img width="1869" height="925" alt="image" src="https://github.com/user-attachments/assets/b7ebf768-5d44-447a-b691-e91dff3ec62c" />

### Verify Otp
<img width="1871" height="923" alt="image" src="https://github.com/user-attachments/assets/c17ff7a4-9c21-4ee5-ab5e-c56d2c13da54" />

### Dashboard
<img width="1877" height="925" alt="image" src="https://github.com/user-attachments/assets/4996541a-7815-4ecc-9997-20a0a9a12415" />

### Board 
<img width="1879" height="930" alt="image" src="https://github.com/user-attachments/assets/f7b8cd03-9336-4047-8a05-25fe4a00498c" />

### Invite member into board
<img width="1877" height="933" alt="image" src="https://github.com/user-attachments/assets/803cab20-f91a-43d2-9a2f-ff99bbc52ca5" />

### Add new card task
<img width="1867" height="920" alt="image" src="https://github.com/user-attachments/assets/84753e5c-bb4d-4016-9360-9090c268fea0" />

### Add new card List
<img width="1874" height="928" alt="image" src="https://github.com/user-attachments/assets/31dfee81-f8d1-4057-8610-00a7f7e3bfe3" />

### Edit Profile
<img width="539" height="367" alt="image" src="https://github.com/user-attachments/assets/d849d9f1-5df2-431d-bed4-f58793dda0ff" />
 
git clone https://github.com/renkunji123/trello-app.git

### Node.js and Express.js Version
<img width="465" height="77" alt="image" src="https://github.com/user-attachments/assets/65077aee-ff39-41c4-9a20-b230841dd127" />

# Config Firebase 
Create a Firebase project: Go to Firebase Console, create a new project.

### Download Service Account Key:

In Project settings (gear icon), select the Service accounts tab.

Click Generate new private key.

Download the JSON file to your computer and rename it to serviceAccountKey.json

Then replace the file with the same name at ../backend

Initialize the Firebase Admin SDK with that key.
### Connect firebase
At the path
../trello-app/
run bash: 
  firebase login
  firebase init hosting

    ? Are you ready to proceed? (Y/n) : Y

  firebase use "your project name"
  
    ? Do you want to use a web framework? (experimental) (Y/n): N 
    ? Configure as a single-page app (rewrite all urls to /index.html)? (Y/n): N
    ? Set up automatic builds and deploys with GitHub? (Y/n): optional
    ? File public/index.html already exists. Overwrite? (y/N): N
  
  firebase deploy

In the project directory, you can run:
# Run server backend first
`cd backend` -> `node server`
The backend will run at the address [http://localhost:3000](http://localhost:3000)
# Run react project
### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3001](http://localhost:3001) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
