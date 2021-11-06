var express = require('express');
const {exec} = require("child_process");
const fs = require("fs");
var path = require('path');
var router = express.Router();

let status = {
    status: "ok",
    message: ""
};

let globalName = "";

async function sh(cmd) {
  status = {
    status: "busy",
    message: "Making PDF..."
  };
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        status = {
          status: "Error",
          message: err
        };
        reject (err);
      } else {
        status = {
          status: "Ready",
          message: "Finished, Your download is ready",
          name: globalName
        };
        resolve({stdout, stderr});
      }
    });
  });
}

async function writeShell (totalPages, issuesNumber, variantsNumber, name) {

  status = {
    status: "busy",
    message: "Writing Shell"
  };

  const access_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwcm9qZWN0SWQiOiJwcmpfNWNkNWEzYWQxNWNhYiIsInByb2plY3RQZXJtaXNzaW9uc0JpdG1hc2siOjF9.WxpiatkegcpXLD1O_Iza4UJIVKT5876XW1J-xVgydpk';

  let code = '';

  console.log('Init writing code for Shell')

  for (let i = 1; i <= totalPages; i++) {
    if (i < 10) {
      code = code.concat(`wget -O "./public/pages/00${i}.jpg" 'https://api-ne.paperlit.com/v8/projects/prj_5cd5a3ad15cab/issues/${issuesNumber}/variants/${variantsNumber}/pages/${i}/original?width=1830&height=2598&accessToken=${access_token}'\n`);
    } else {
      code = code.concat(`wget -O "./public/pages/0${i}.jpg" 'https://api-ne.paperlit.com/v8/projects/prj_5cd5a3ad15cab/issues/${issuesNumber}/variants/${variantsNumber}/pages/${i}/original?width=1830&height=2598&accessToken=${access_token}'\n`);
    }
  }

  code = code.concat(`convert ./public/pages/*.jpg ./public/PDF/${name}.pdf\n`);

  code = code.concat(`rm ./public/pages/*.jpg\n`);

  await fs.writeFileSync('./public/shell/get_image.sh', code);

  status = {
    status: "busy",
    message: "Shell Written, going to step 2"
  };

  console.log('Shell file written')
}

router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/info', (req, res, next) => {
  res.json(status);
});

router.get('/download/:pdf', (req, res, next) => {
  res.download(`./public/PDF/${req.params.pdf}.pdf`);
});

router.post('/', async (req, res, next) => {

  res.sendFile(path.join(__dirname, '../public/download.html'));

  const uniqueName = String(req.body.issues) + String(req.body.variants);

  let name = '';

  if(req.body.pdfname === '') {
    name = uniqueName;
    globalName = name;
  } else {
    name = req.body.pdfname;
    globalName = req.body.pdfname;
  }

  await writeShell(req.body.pages, req.body.issues, req.body.variants, name)
  await sh('./public/shell/get_image.sh');

  console.log('Ready for new request...')
})

module.exports = router;
