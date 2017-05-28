<h1>First, foremost, and most important:<h1>
<h3>I, nor the code, nor any derivative effects this code has/creates cannot be held accountable for any
loss/problems that could arise from its usage<h3>
It's still somewhat a construction place, but does do the work perfectly for me. You are still responsible for yourself to know what you are doing and to be aware that programs are fallable beings.

<h1>What this tool does</h1>
<ul>
    <li>Let's you place your orders *significantly* faster compared to Kraken's user interface</li>
    <li>Gives you a "fresher" update of the book's state -- refreshes every ~10 seconds</li>
    <li>Lets you move your orders up/down to the closest next order</li>
</ul>
<h1>How to</h1>
The following installation guide does not cover everything. Create issues if you stumble upon something. Will respond fast and update README.
<h2>Create kraken API key file</h2>
Create a file "kraken.key.json" in the root directory and add
<pre>
{ key: "your key", secret: "your secret" }
</pre>
This is obviously mandatory to do anything on kraken.

<h2>Install build/run tools</h2>
Things needed: npm, node. Then do:
<pre>
    npm install gulp --global
    npm install typescript --global
</pre>

<h2>Install needed packages</h2>
<pre>npm install</pre> in the root directory should do it.

<h2>Build client and server + Run server</h2>
<pre>gulp client-all && tsc --project server && node build/server/main.js</pre>

<h2>Open interface</h2>
Open your browser and go to "http://127.0.0.1:8090" (without quotes).

<h1>Preview:</h1>
<img src="http://i.imgur.com/CtWukyl.png" width="100%"></img>