# このリポジトリについて

このリポジトリでは、本インターンシップを通して皆さんに開発していただく AI チャットボットシステムのベースとなるプログラムを提供しています。  
下記の事前準備にしたがって設定を行うことで、AWS の Bedrock を利用した LLM との会話を行うことができます。

このプログラムをもとに、各グループで独自のシステムを構築してみましょう！

# 事前準備

## ローカル開発環境の場合

1. `server`ディレクトリにある`.env.example`を複製し、名前を`.env.local`に変更してください。
2. `.env.local` ファイルを編集し、以下の情報をそれぞれ入力してください。

   使用している AWS の認証方式ごとに、それぞれ以下のようにアカウント情報を記載してください。  
   （使用しない方は行頭に`#`をつけてコメントアウトするか、行ごと削除する）

   - SSO を利用している場合には、`AWS_PROFILE`を指定
   - アクセスキーを利用している場合には、`AWS_ACCESS_KEY_ID`と`AWS_SECRET_ACCESS_KEY`を指定

   - また、`MODEL_ID` には使用するモデルの Inference profile ARN を指定してください。

3. ルートディレクトリで、`npm run install:all`を実行し、フロントエンドとバックエンドの両方に必要なパッケージを一括でインストールします。
4. 同じくルートディレクトリにて、`npm run dev`を実行してアプリを起動します。
5. ブラウザから http://localhost:5174 にアクセスし、AI チャットボットが利用できることを確認します。

※ より詳細に `/web` と `/server` のログを別々に確認したい場合には、上記のコマンドではなく `npm --prefix web run dev` と `npm --prefix server run dev` を別々に実行しましょう。

## EC2 上で起動する場合

1. EC2 の権限や VPC の割り当てを適切に設定して下さい。
2. ローカル環境の場合と同様に、`MODEL_ID` を指定してパッケージのインストールを行います。
3. デフォルトの設定では、このまま `npm run dev`を実行してもブラウザからアクセスすることができません。  
   起動時のログやネット上の情報を参考に、ブラウザから `http://<EC2のパブリックIP>:5174` の形式でチャットアプリに接続できるようにしましょう。

# 技術スタック

## Web サーバー

SPA になっており、vite を利用しています。
https://vite.dev/

```zsh
% npm --prefix web install
% npm --prefix web run dev
```

http://localhost:5174/ を開いてください。

## API サーバー

express を利用しています。
https://expressjs.com/

```zsh
% npm --prefix server install
% npm --prefix server run dev
```

開発時、API サーバーは vite の開発サーバーを通してアクセスされます。

## コードチェック

それぞれのディレクトリで check のスクリプトを用意しています。  
なお、こちらもルートディレクトリから一括で check 可能です。（ルートディレクトリにて `npm run check` を実行）

```zsh
% npm --prefix web run check
% npm --prefix server run check
```

## 本番ビルド

docker build をします。 SPA の静的ファイルは express より配信されます。

```
% make IMAGE_NAME=<your image name>
```
