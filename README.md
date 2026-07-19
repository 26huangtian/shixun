http://localhost:3000

2539424016@qq.com

SSGSS123

http://localhost:3000

2539424017@qq.com

SSGSS123

\# Eduspace 全栈课程管理实训项目

\## 项目介绍

本项目为个人独立完成的全栈课程管理Demo系统，前端基于Next.js 16开发页面交互，后端采用Python Flask搭建接口服务，使用Supabase云PostgreSQL数据库存储课程、用户数据，实现课程新增、课程列表查询、数据展示等核心功能。

项目全程独立完成前端页面制作、后端接口开发、数据库搭建、Git版本管理与线上部署，可提供公开线上访问链接用于演示。



\## 技术栈

\### 前端

Next.js 16（Turbopack）、JavaScript、环境变量.env.local、npm包管理、VS Code

\### 后端

Python Flask、Flask-SQLAlchemy、Supabase PostgreSQL数据库、\*\*PyCharm专业/社区版\*\*

\### 工具与运维

Git \& GitHub（版本控制）、Vercel（前端线上部署）、Render（后端线上部署）、PowerShell、VS Code



\## 目录结构

eduspace

├── frontend/ # Next.js 前端全部源码（VS Code 开发）

├── backend/ # Flask 后端项目（PyCharm 开发）

│ ├── venv/ # Python 虚拟环境（git 自动忽略）

│ ├── app.py # 后端入口、接口逻辑

│ ├── models.py # 数据库数据表模型定义

│ └── requirements.txt # Python 依赖清单

├── doc/

│ └── screenshot/ # 实训全部归档截图：数据库、接口、报错、AI 开发记录截图

├── api.md # 后端接口完整 API 文档

├── prompt\_log.md # AI 辅助开发全过程提问日志（实训强制文档）

├── .gitignore # Git 忽略配置文件

└── README.md # 项目说明文档



\## 本地安装\&运行指南

\### 前置环境

1\. Node.js（msi安装包配置环境变量）

2\. Python 3.10及以上版本

3\. Git

4\. PyCharm（后端开发专用IDE）、VS Code（前端开发）



\### 1. 克隆项目到本地

```powershell

git clone https://github.com/26huangtian/.git

cd eduspace

2\. 前端启动步骤（VS Code / PowerShell）

进入前端文件夹

powershell

cd frontend

安装前端依赖

powershell

npm install

新建.env.local文件，填入 Supabase 项目 URL、anon 密钥、后端接口地址

启动前端开发服务

powershell

npm run dev

访问地址：http://localhost:3000

3\. 后端启动步骤（PyCharm 操作流程，推荐）

打开 PyCharm，选择「Open」，选中项目内backend文件夹导入

PyCharm 会自动检测目录，弹窗提示创建虚拟环境，选择使用本地 Python3.10 解释器，自动生成venv

自动激活虚拟环境后，打开底部 Terminal 终端，安装依赖

shell

pip install -r requirements.txt

在app.py内填写 Supabase 数据库 Host、数据库密码等连接信息

右键app.py，点击「Run 'app'」启动后端服务

本地接口地址：http://127.0.0.1:5000

备用：PowerShell 手动启动后端（无 PyCharm 时）

powershell

cd backend

python -m venv venv

.\\venv\\Scripts\\activate

pip install -r requirements.txt

python app.py

API 文档说明

后端所有接口详细规范、请求参数、返回 JSON 示例单独存放于 api.md 文件，包含课程查询、新增课程两大核心接口，附带接口调用截图。

线上部署演示地址

前端 Demo 访问链接（Vercel 部署）：https://shixun-tau.vercel.app/login

后端线上接口地址：(https://sdassdgsgfs.pythonanywhere.com/)

数据库说明

数据库使用 Supabase 云 PostgreSQL，自行创建课程数据表、用户表；

相关数据表结构、数据库连接配置截图存放于 doc/screenshot/db/。

实训交付配套文档清单

项目完整源码（GitHub 公开仓库）

线上可访问 Demo URL

归档截图包：数据库截图、接口调用截图、AI 排错对话截图

项目文档：README.md、prompt\_log.md、api.md

项目演示录屏

个人实训总结报告

开发说明

项目全程个人独立完成：前端所有页面设计与交互逻辑、后端接口全部编码、数据库表设计与 SQL 编写、Git 代码管理、线上部署流程均自主完成。后端代码全程使用 PyCharm 编写调试，前端使用 VS Code 开发。

开发过程中借助 AI 工具解决环境报错、代码语法、部署流程等问题，完整提问记录保存在prompt\_log.md，每条提问附带 AI 原始回答与对应截图，可溯源代码开发全过程。

忽略文件 .gitignore

plaintext

\# Python虚拟环境

backend/venv/

\_\_pycache\_\_/

\*.pyc



\# PyCharm配置缓存

backend/.idea/

\*.iml

.idea/



\# 前端依赖

frontend/node\_modules/

frontend/.next/

frontend/.env.local



\# 日志、缓存

npm-cache/

logs/

