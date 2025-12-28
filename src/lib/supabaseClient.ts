import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// サーバーサイドでのビルド時に環境変数がなくてもエラーにならないように、
// URLがない場合はダミーのクライアント（またはnull）を返すか、
// クライアント作成自体を関数化して呼び出し時にチェックする等の対応が必要ですが、
// 簡易的には空文字フォールバックなどでビルドを通す手があります。
// ただし、Vercel上では環境変数を設定する必要があります。

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

