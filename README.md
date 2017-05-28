<h1>How to</h1>
<h2>Create kraken API key file</h2>
Create a file "kraken.key.json" in the root directory and add
<pre>
{ key: "your key", secret: "your secret" }
</pre>
This is obviously mandatory to do anything on kraken.

<h2>Install needed packages</h2>
<pre>npm install</pre> in the root directory should do it.
Post Issues if more is needed -- not much motivation on my side to do an installation on a clean OS to get a confident installation guide. :)

<h2>Build client and server + Run server</h2>
<pre>gulp client-all && tsc --project server && node build/server/main.js</pre>