

importPackage(java.io);

include( _ScriptPath_ + "\\cPegjsParser.js" );
include( _ScriptPath_ + "\\cParser.js" );
include( _ScriptPath_ + "\\json2.js" );


function saveObject( objToSave, filePathName )
{
    try
    {
        filePathName += ".json";
        var stringifiedField = JSON.stringify( objToSave, undefined, 4 );
        var append = false;
        var brFileOut = new PrintStream( new FileOutputStream( filePathName, append ) ); // creates/opens a file to write with append option
        brFileOut.println( stringifiedField ); 
        brFileOut.close();
        return { status: 0 };
    }
    catch( e )
    {
        return { status: 1 };
    }
}

function readFile( filePathName )
{
    try
    {
        return ( "" + new java.util.Scanner( new java.io.File( filePathName ) ).useDelimiter( "\\Z" ).next() );
    }
    catch( e )
    {
        return "";
    }
}

function globalLogger( message )
{
    SystemOut.println( message );
    // print( message );
}

main();
function main()
{
    var result;
    
    result = readFile( _ScriptPath_ + "\\hsl.i" );
    smokeTest( result );
    
    // cParser.reset();
    
    // if( "" != result )
    // {
        // // result = cParser.parse( result );
        // result = cParser.parse( "int test;" );
        // // result = cParser.parse( "int test0[5]; int *test1[5*2]; int **test2;" );
        // // result = cParser.parse( "enum testEnum{VAL1,VAL2=VAL1+1};" );// typedef struct{enum{asdf,qwer}e;int i;}s_t;" );
        // // result = cParser.parse( "int static const unsigned nopointer, * const volatile * * test, *ptr; int * ( * myVar[][8]()(int a[]()) )[2];" );
        // // result = cParser.parse( "int func( int, void*, int[], void*a, int a[]  );" );
        // // result = cParser.parse( "int func( int* [][5], short**[](), long* a[](int), char** b[](int a)  );" );
        // // result = cParser.parse( "int myString[MAX] = \"asdf\";" );
    // }
    
    // if( 0 == result.status )
    // {
        // globalLogger( "SUCCESS0!" );
    // }
    // else
    // {
        // globalLogger( "FAILURE0!" );
    // }
    
    // result = saveObject( cParser, _ScriptPath_ + "\\cParserDump" );
    
    // if( 0 == result.status )
    // {
        // globalLogger( "SUCCESS1!" );
    // }
    // else
    // {
        // globalLogger( "FAILURE1!" );
    // }
    
    return;
}

function callTest( input )
{
    cParser.reset();
    var result = cParser.parse( input );
    if( 0 == result.status )
    {
        globalLogger( "SUCCESS: " + input );
    }
    else
    {
        globalLogger( "FAIL___: " + input );
    }
    result = saveObject( cParser, _ScriptPath_ + "\\cParserDump" );
}

function smokeTest( hsl_i )
{
    // callTest( "int test;" );
    // callTest( "long test;" );
    // callTest( "long long test;" );
    // callTest( "typedef const long signed int volatile static extern inline _stdcall test;" );
    // callTest( "typedef int * const * volatile MY_TYPE;" );
    // callTest( "int test[];" );
    // callTest( "int test[*];" );
    // callTest( "int test[5];" );
    // callTest( "int test[MAX];" );
    // callTest( "int test[(5*MAX)+1];" );
    // callTest( "int test[1][2][3];" );
    // callTest( "int test();" );
    // callTest( "int test( void );" );
    // callTest( "int test( int );" );
    // callTest( "int test( const int );" );
    // callTest( "int test( int a );" );
    // callTest( "int test( int [] );" );
    // callTest( "int test( int a[] );" );
    // callTest( "int test( int [*] );" );
    // callTest( "int test( int a[*] );" );
    // callTest( "int test( int [5] );" );
    // callTest( "int test( int a[5] );" );
    // callTest( "int test( int [MAX] );" );
    // callTest( "int test( int a[MAX] );" );
    // callTest( "int test( int [(5*MAX)+1] );" );
    // callTest( "int test( int a[(5*MAX)+1] );" );
    // callTest( "int test( int [1][2][3] );" );
    // callTest( "int test( int [], int [*], int [5], int [MAX], int [(5*MAX)+1] );" );
    // callTest( "int test( int *() );" );
    // callTest( "int test( int *(void) );" );
    // callTest( "int test( int *(int) );" );
    // callTest( "int test( int *(int a) );" );
    // callTest( "int test( int (*)(int, long, int *, int []) );" );
    // callTest( "int test0; int test1;" );
    // callTest( "int test0, test1;" );
    // callTest( "int test0[*], ( * (*test1)(void) )[];" );
    // callTest( "enum tag;" );
    // callTest( "enum {VAL0} test;" );
    // callTest( "enum {VAL0 = 0} test;" );
    // callTest( "enum {VAL0 = MAX} test;" );
    // callTest( "enum {VAL0 = (5*MAX)+1} test;" );
    // callTest( "enum {VAL0, VAL1} test;" );
    // callTest( "enum {VAL0, VAL1 = 0} test;" );
    // callTest( "enum {VAL0, VAL1 = MAX} test;" );
    // callTest( "enum {VAL0, VAL1 = (5*MAX)+1} test;" );
    // callTest( "enum {VAL0, VAL1 = (5*VAL0)+1} test;" );
    // callTest( "enum tag {VAL0} test;" );
    // callTest( "enum tag {VAL0 = 0} test;" );
    // callTest( "enum tag {VAL0 = MAX} test;" );
    // callTest( "enum tag {VAL0 = (5*MAX)+1} test;" );
    // callTest( "enum tag {VAL0, VAL1} test;" );
    // callTest( "enum tag {VAL0, VAL1 = 0} test;" );
    // callTest( "enum tag {VAL0, VAL1 = MAX} test;" );
    // callTest( "enum tag {VAL0, VAL1 = (5*MAX)+1} test;" );
    // callTest( "enum tag {VAL0, VAL1 = (5*VAL0)+1} test;" );
    // callTest( "typedef enum tag {VAL0, VAL1} myType;" );
    // callTest( "typedef int MY_TYPE; MY_TYPE testando;" );
    // callTest( "struct myStruct { int a; int* b; int c[2]; void ( * d )(); int const _a; int* const _b; int bf0 : 1; int : 2; int bf1 : 3; int bf2 : 0; };" );
    // callTest( "struct myStruct { int bf0 : 1, : 2, bf1 : 3, bf2 : 0, : 0; };" );
    // callTest( "int a; int f1(); int f2(){return;} int* f3(){return;} int** f4(int a, int* b ){return;}" );
    callTest( "int a; void f(){ a = 1llu; }" );
    
    return;
}
























