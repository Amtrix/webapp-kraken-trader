#include <iostream>
#include <fstream>
#include <stdlib.h>
using namespace std;

int main() {
    std::string fileName("kraken.key.json" );
    ifstream fin( fileName.c_str() );

    if( fin.fail() )
    {
        string key, secret;
        cout << "Please provide your API key: " << endl;
        cin >> key;
        cout << "Please provide your API secret: " << endl;
        cin >> secret;
    }

    system(".\\node.exe build\\server\\main.js");
}