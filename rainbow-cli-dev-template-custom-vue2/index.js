const fse = require("fs-extra");
const ejs = require("ejs");
const glob = require("glob");
const inquirer = require("inquirer");

async function ejsRender(options) {
  const { targetPath, ignore, data } = options;
  const dir = targetPath;
  const projectInfo = data;
  return new Promise((resolve, reject) => {
    glob("**", { cwd: dir, ignore, nodir: true }, (err, file) => {
      if (err) {
        reject(err);
      }
      Promise.all(
        file.map((file) => {
          const filePath = path.join(dir, file);
          return new Promise((resolve1, reject1) => {
            // ejs渲染每个文件
            ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
              if (err) {
                reject1(err);
              } else {
                // ejs读取的是字符串，并没有把字符串写入文件，需要把文件内容写入文件
                fse.writeFileSync(filePath, result);
                resolve1(result);
              }
            });
          });
        })
      )
        .then(() => {
          return resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

async function install(options) {
  const { templateInfo, projectInfo, templatePath, targetPath } = options;
  try {
    const promptArr = [];
    fse.ensureDirSync(templatePath); //如果目录不存在会创建
    fse.ensureDirSync(targetPath);
    fse.copySync(templatePath, targetPath);
    const descriptionPrompt = {
      type: "input",
      name: "description",
      message: "请输出组件描述信息",
      default: "",
      validate(v) {
        var done = this.async();
        setTimeout(function () {
          if (!v) {
            done("请输入组件描述信息");
            return;
          }
          done(null, true);
        }, 0);
      },
    };
    promptArr.push(descriptionPrompt);
    const { description } = await inquirer.prompt(promptArr);
    const ignore = ["node_moduels/**", ...(templateInfo.ignore || [])];
    projectInfo.description = description;
    // ejs模板渲染package.jso
    await ejsRender({ ignore, targetPath, data: projectInfo });
    // const { installCommand, startComman d } = this.templateInfo;
    // // 依赖安装
    // await this.execCommand(installCommand, "依赖安装失败！");
    // // 启动命令
    // await this.execCommand(startCommand, "启动项目失败！");
  } catch (e) {
    throw e;
  }
}

module.exports = install;
