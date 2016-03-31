//===========================================================================
//
//  Parsing Expression Grammar of C for Mouse 1.1 - 1.5.
//  Based on standard ISO/IEC 9899.1999:TC2, without preprocessor.
//  Requires semantics class to process Typedefs.
//
//---------------------------------------------------------------------------
//
//  Copyright (C) 2007, 2009, 2010 by Roman R Redziejowski (www.romanredz.se).
//
//  The author gives unlimited permission to copy and distribute
//  this file, with or without modifications, as long as this notice
//  is preserved, and any changes are properly documented.
//
//  This file is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
//
//---------------------------------------------------------------------------
//
//  Latest update 2010-11-19
//
//---------------------------------------------------------------------------
//
//  Modifications to the standard grammar:
//
//    Defined # as start of line comment.
//    Added FunctionSpecifier "_stdcall".
//    Added TypeQualifier "__declspec()".
//    Added TypeSpecifier "__attribute__()".
//    The scope of TypedefNames is not implemented.
//
//---------------------------------------------------------------------------
//
//  Implementation of typedefs.
//
//  A TypedefName is an Identifier that has been declared as such
//  by a previous typedef declaration. It can be used as TypeSpecifier
//  in DeclarationSpecifiers and SpecifierQualifierList.
//  Recognizing it as such is essential for correct parsing.
//  In other contexts, TypedefName is treated as an ordinary Identifier.
//
//  According to 6.7.2, comment 2, of the Standard, TypedefName can appear
//  in DeclarationSpecifiers or SpecifierQualifierList at most once,
//  and then as the only TypeSpecifier. To make sure that an Identifer
//  is recognized as TypedefName only in these contexts, definitions
//  of these items are changed as follows:
//
//  - TypedefName is removed as an alternative of TypeSpecifier.
//
//  - DeclarationSpecifiers and SpecifierQualifierList are redefined
//    to allow either single TypedefName or one or more TypeSpecifiers.
//
//  The semantics class, via semantic actions, maintains a table of TypedefNames.
//
//  The rule defining TypedefName as Identifier has a semantic action
//  that returns true iff the Identifier is in the table.
//  That means TypedefName is accepted iff it is in the table.
//
//  According to 6.7.7, comment 3, of the Standard,
//  in a Declaration whose StorageClassSpecifier is TYPEDEF,
//  each Declarator defines an Identifier to be a TypedefName.
//  These Identifiers are entered into the table as follows.
//
//  - Each Identifier has itself as semantic value.
//
//  - Each DirectDeclarator starts with either Identifier
//    or Declarator in parentheses.
//    Its semantic value is either that Identifier,
//    or the Identifier obtained as semantic value of that Declarator.
//
//  - Each Declarator has as semantic value the Identifier
//    appearing in its DirectDeclarator,
//
//  - Each InitDeclarator has as semantic value the Identifier
//    appearing in its Declarator.
//
//  - InitDeclaratorList has as semantic value
//    the list of Identifiers appearing in its InitDeclarators.
//
//  - DeclarationSpecifiers has semantic value "typedef"
//    if any of the specifiers is "typedef" or null otherwise.
//
//  - Declaration has a semantic action that enters Identifiers
//    delivered by InitDeclaratorList into typedef table
//    if DeclarationSpecifiers indicate "typedef".
//
//
//---------------------------------------------------------------------------
//
//  Change log
//    2009-07-13 Posted on Internet.
//    2010-11-19 Removed superfluous '?' after 'Spacing'.
//
//===========================================================================

{
    //-------------------------------------------------------------------
    //  Support for resetting the typedef list and setting a custom callback.
    //  Place this code at the end of the generated parser, before:
    //    return {
    //    SyntaxError: peg$SyntaxError,
    //    parse:       peg$parse
    //  };
    //-------------------------------------------------------------------
    var gSettings;
    gSettings = {};
    gSettings.callback = undefined;
    gSettings.typedefs = undefined;
    peg$parse.reset = function( func )
    {
        gSettings.callback = func;
        gSettings.typedefs = [];
    };
    
    //-------------------------------------------------------------------
    //  Grammar extension to process typedefs correctly.
    //-------------------------------------------------------------------
    var cPEG_ext = new function()
    {
        //=======================================================================
        //
        //  Callback called before parserDefaultAction return.
        //
        //=======================================================================
        this.callback;
        
        //=======================================================================
        //
        //  Typedef table
        //
        //=======================================================================
        this.typedefs;
        
        //-------------------------------------------------------------------
        //  Initialization.
        //  This method is called before the processing of each input file.
        //-------------------------------------------------------------------
        this.init = function()
        {
            if( (        gSettings          === undefined  ) ||
                (        gSettings.callback === undefined  ) ||
                ( typeof gSettings.callback !== "function" ) )
            {
                this.callback = function( lhs, rhs, from ){ return; };
            }
            else
            {
                this.callback = gSettings.callback;
            }
            
            if( ( gSettings          !== undefined      ) &&
                ( gSettings.typedefs !== undefined      ) &&
                ( gSettings.typedefs instanceof Array ) )
            {
                this.typedefs = gSettings.typedefs;
            }
            else
            {
                this.typedefs = [];
            }
        };
        this.init();
        
        //=======================================================================
        //
        //  Semantic actions
        //
        //=======================================================================
        this.parserDefaultAction = function( lhs, rhs, from )
        {
            var i;
            var string;
            var idList;
            var oldLhs;
            
            oldLhs = lhs;
            lhs = {};
            lhs.text     = oldLhs;
            lhs.semantic = "";
            lhs.isA      = from;
            
            switch( from )
            {
                case "Declaration":
                    //-------------------------------------------------------------------
                    //  Declaration = DeclarationSpecifiers InitDeclaratorList? SEMI
                    //                         0                    1?           2
                    //-------------------------------------------------------------------
                    // If InitDeclaratorList is present and DeclarationSpecifiers
                    // contain "typedef", copy all Identifiers delivered
                    // by InitDeclaratorList into typedefs table.
                    if( ( null !== rhs[1] ) && ( "typedef" == rhs[0].semantic ) )
                    {
                        for( i = 0; i < rhs[1].semantic.length; i++ )
                        {
                            string = rhs[1].semantic[i].match( /[\w]+/ );
                            if( ( null !== string ) && ( string instanceof Array ) )
                            {
                                string = string[0];
                            }
                            this.typedefs.push( string );
                        }
                    }
                    break;
                case "DeclarationSpecifiers":
                    //-------------------------------------------------------------------
                    //  DeclarationSpecifiers = ( ( StorageClassSpecifier / TypeQualifier / FunctionSpecifier )*
                    //                                      0,i                  0,i               0,i
                    //                            TypedefName ( StorageClassSpecifier / TypeQualifier / FunctionSpecifier )* ) /
                    //                                 1                 2,i                 2,i               2,i
                    //                          ( StorageClassSpecifier / TypeSpecifier / TypeQualifier / FunctionSpecifier )+
                    //                                     i                   i               i                  i
                    //-------------------------------------------------------------------
                    // This semantic action is called by both alternatives
                    // of DeclarationSpecifiers.
                    // Scan all Specifiers and return semantic value "typedef"
                    // if any of them is "typedef".
                    if( null !== lhs.text.match( /\b(typedef)\b/ ) )
                    {
                        lhs.semantic = "typedef";
                    }
                    
                    break;
                case "InitDeclaratorList":
                    //-------------------------------------------------------------------
                    //  InitDeclaratorList = InitDeclarator (COMMA           InitDeclarator)*
                    //                              0        1,0,0;1,1,0..   1,0,1;1,1,1,..
                    //-------------------------------------------------------------------
                    // Build Vector of Identifiers delivered by InitDeclarators
                    // and return it as semantic value.
                    idList = [ rhs[0].text ];
                    if( ( null !== rhs[1] ) && ( undefined !== rhs[1].length ) )
                    {
                        for( i = 0; i < rhs[1].length; i++ )
                        {
                            idList.push( rhs[1][i][1].semantic );
                        }
                    }
                    lhs.semantic = idList;
                    break;
                case "InitDeclarator":
                    //-------------------------------------------------------------------
                    //  InitDeclarator = Declarator (   EQU    Initializer)?
                    //                        0       1,0;1,2    1,1;1,3
                    //-------------------------------------------------------------------
                    // Return as semantic value the Identifier delivered by Declarator.
                    lhs.semantic = rhs[0].semantic;
                    break;
                case "Declarator":
                    //-------------------------------------------------------------------
                    //  Declarator = Pointer? DirectDeclarator
                    //                  0           1
                    //-------------------------------------------------------------------
                    // Return as semantic value the Identifier delivered
                    // by DirectDeclarator.
                    lhs.semantic = rhs[1].semantic;
                    break;
                case "DirectDeclarator":
                    //-------------------------------------------------------------------
                    //  DirectDeclarator = (Identifier / LPAR Declarator RPAR) ... etc.
                    //                          0         0,0     0,1     0,2
                    //-------------------------------------------------------------------
                    // Return as semantic value either the Identifier appearing on the rhs,
                    // or the Identifier delivered by DirectDeclarator.
                    if( ( rhs[0] instanceof Array ) && ( "LPAR" == rhs[0][0].isA ) )
                    {
                        lhs.semantic = rhs[0][1].semantic;
                    }
                    else
                    {
                        lhs.semantic = rhs[0].semantic;
                    }
                    break;
                case "Identifier":
                    //-------------------------------------------------------------------
                    //  Identifier = !Keyword IdNondigit     IdChar*   Spacing
                    //                  0         1       2,0;2,1;2...    3
                    //-------------------------------------------------------------------
                    // Return as semantic value the String specified as Identifier.
                    string = rhs[1].text;
                    for( i = 0; i < rhs[2].length; i++ )
                    {
                        string += rhs[2][i].text;
                    }
                    lhs.semantic = string;
                    break;
                case "TranslationUnit":
                    return this.typedefs;
                    break;
                default:
                    break;
            }
            
            this.callback( lhs, rhs, from );
            
            return lhs;
        };
        
        //-------------------------------------------------------------------
        //  TypedefName = Identifier
        //                     0
        //-------------------------------------------------------------------
        this.AND_TypedefName = function( identifier )
        {
            // Return true if the Identifier appears in the typedefs table;
            // otherwise return false.
            var typedefName;
            var i;
            typedefName = identifier.semantic.slice( 0 ).trim();
            for( i = 0; i < this.typedefs.length; i++ )
            {
                if( typedefName == this.typedefs[i] )
                    return true;
            }
            return false;
        };
        
    };
}


//-------------------------------------------------------------------------
//  A.2.4  External definitions
//-------------------------------------------------------------------------

TranslationUnit = rhs: (
    Spacing ExternalDeclaration+ EOT
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "TranslationUnit" ); }

ExternalDeclaration = rhs: (
    FunctionDefinition
    / Declaration
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ExternalDeclaration" ); }

FunctionDefinition = rhs: (
    DeclarationSpecifiers Declarator DeclarationList? CompoundStatement
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "FunctionDefinition" ); }

DeclarationList = rhs: (
    Declaration+
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DeclarationList" ); }


//-------------------------------------------------------------------------
//  A.2.2  Declarations
//-------------------------------------------------------------------------

Declaration = rhs: (
    DeclarationSpecifiers InitDeclaratorList? SEMI
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Declaration" ); }

DeclarationSpecifiers = rhs: (
    choice0: (( StorageClassSpecifier
       / TypeQualifier
       / FunctionSpecifier
       )*
       TypedefName
       ( StorageClassSpecifier
       / TypeQualifier
       / FunctionSpecifier
       )*
      )     { return cPEG_ext.parserDefaultAction( text(), choice0, "DeclarationSpecifiers" ); }
    / choice1: ( StorageClassSpecifier
      / TypeSpecifier
      / TypeQualifier
      / FunctionSpecifier
      )+    { return cPEG_ext.parserDefaultAction( text(), choice1, "DeclarationSpecifiers" ); }
    )

InitDeclaratorList = rhs: (
    InitDeclarator (COMMA InitDeclarator)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "InitDeclaratorList" ); }

InitDeclarator = rhs: (
    Declarator (EQU Initializer)?
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "InitDeclarator" ); }

StorageClassSpecifier = rhs: (
    TYPEDEF
    / EXTERN
    / STATIC
    / AUTO
    / REGISTER
    / ATTRIBUTE LPAR LPAR (!RPAR _)* RPAR RPAR
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "StorageClassSpecifier" ); }

TypeSpecifier = rhs: (
    VOID
    / CHAR
    / SHORT
    / INT
    / LONG
    / FLOAT
    / DOUBLE
    / SIGNED
    / UNSIGNED
    / BOOL
    / COMPLEX
    / StructOrUnionSpecifier
    / EnumSpecifier
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "TypeSpecifier" ); }

StructOrUnionSpecifier = rhs: (
    StructOrUnion
      ( Identifier? LWING StructDeclaration+ RWING
      / Identifier
      )
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "StructOrUnionSpecifier" ); }

StructOrUnion = rhs: (
    STRUCT
    / UNION
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "StructOrUnion" ); }

StructDeclaration = rhs: (
    SpecifierQualifierList StructDeclaratorList SEMI
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "StructDeclaration" ); }

SpecifierQualifierList = rhs: (
    ( TypeQualifier*
        TypedefName
        TypeQualifier*
      )
    / ( TypeSpecifier
      / TypeQualifier
      )+
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "SpecifierQualifierList" ); }

StructDeclaratorList = rhs: (
    StructDeclarator (COMMA StructDeclarator)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "StructDeclaratorList" ); }

StructDeclarator = rhs: (
    Declarator? COLON ConstantExpression
    / Declarator
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "StructDeclarator" ); }

EnumSpecifier = rhs: (
    ENUM
      ( Identifier? LWING EnumeratorList COMMA? RWING
      / Identifier
      )
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EnumSpecifier" ); }

EnumeratorList = rhs: (
    Enumerator (COMMA Enumerator)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EnumeratorList" ); }

Enumerator = rhs: (
    EnumerationConstant (EQU ConstantExpression)?
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Enumerator" ); }

TypeQualifier = rhs: (
    CONST
    / RESTRICT
    / VOLATILE
    / DECLSPEC LPAR Identifier RPAR
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "TypeQualifier" ); }

FunctionSpecifier = rhs: (
    INLINE
    / STDCALL
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "FunctionSpecifier" ); }

Declarator = rhs: (
    Pointer? DirectDeclarator
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Declarator" ); }

DirectDeclarator = rhs: (
    ( Identifier
      / LPAR Declarator RPAR
      )
      ( LBRK TypeQualifier* AssignmentExpression? RBRK
      / LBRK STATIC TypeQualifier* AssignmentExpression RBRK
      / LBRK TypeQualifier+ STATIC AssignmentExpression RBRK
      / LBRK TypeQualifier* STAR RBRK
      / LPAR ParameterTypeList RPAR
      / LPAR IdentifierList? RPAR
      )*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DirectDeclarator" ); }

Pointer = rhs: (
    ( STAR TypeQualifier* )+
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Pointer" ); }

ParameterTypeList = rhs: (
    ParameterList (COMMA ELLIPSIS)?
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ParameterTypeList" ); }

ParameterList = rhs: (
    ParameterDeclaration (COMMA ParameterDeclaration)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ParameterList" ); }

ParameterDeclaration = rhs: (
    DeclarationSpecifiers
      ( Declarator
      / AbstractDeclarator
      )?
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ParameterDeclaration" ); }

IdentifierList = rhs: (
    Identifier (COMMA Identifier)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "IdentifierList" ); }

TypeName = rhs: (
    SpecifierQualifierList AbstractDeclarator?
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "TypeName" ); }

AbstractDeclarator = rhs: (
    Pointer? DirectAbstractDeclarator
    / Pointer
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "AbstractDeclarator" ); }

DirectAbstractDeclarator = rhs: (
    ( LPAR AbstractDeclarator RPAR
      / LBRK (AssignmentExpression / STAR)? RBRK
      / LPAR ParameterTypeList? RPAR
      )
      ( LBRK (AssignmentExpression / STAR)? RBRK
      / LPAR ParameterTypeList? RPAR
      )*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DirectAbstractDeclarator" ); }

TypedefName = rhs: (
    identifier: Identifier &{ return cPEG_ext.AND_TypedefName( identifier ); }
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "TypedefName" ); }

Initializer = rhs: (
    AssignmentExpression
    / LWING InitializerList COMMA? RWING
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Initializer" ); }

InitializerList = rhs: (
    Designation? Initializer (COMMA Designation? Initializer)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "InitializerList" ); }

Designation = rhs: (
    Designator+ EQU
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Designation" ); }

Designator = rhs: (
    LBRK ConstantExpression RBRK
    / DOT Identifier
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Designator" ); }


//-------------------------------------------------------------------------
//  A.2.3  Statements
//-------------------------------------------------------------------------

Statement = rhs: (
    LabeledStatement
    / CompoundStatement
    / ExpressionStatement
    / SelectionStatement
    / IterationStatement
    / JumpStatement
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Statement" ); }

LabeledStatement = rhs: (
    Identifier COLON Statement
    / CASE ConstantExpression COLON Statement
    / DEFAULT COLON Statement
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LabeledStatement" ); }

CompoundStatement = rhs: (
    LWING ( Declaration / Statement )* RWING
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "CompoundStatement" ); }

ExpressionStatement = rhs: (
    Expression? SEMI
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ExpressionStatement" ); }

SelectionStatement = rhs: (
    IF LPAR Expression RPAR Statement (ELSE Statement)?
    / SWITCH LPAR Expression RPAR Statement
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "SelectionStatement" ); }

IterationStatement = rhs: (
    WHILE LPAR Expression RPAR Statement
    / DO Statement WHILE LPAR Expression RPAR SEMI
    / FOR LPAR Expression? SEMI Expression? SEMI Expression? RPAR Statement
    / FOR LPAR Declaration Expression? SEMI Expression? RPAR Statement
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "IterationStatement" ); }

JumpStatement = rhs: (
    GOTO Identifier SEMI
    / CONTINUE SEMI
    / BREAK SEMI
    / RETURN Expression? SEMI
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "JumpStatement" ); }


//-------------------------------------------------------------------------
//  A.2.1  Expressions
//-------------------------------------------------------------------------

PrimaryExpression = rhs: (
    Identifier
    / Constant
    / StringLiteral
    / LPAR Expression RPAR
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "PrimaryExpression" ); }

PostfixExpression = rhs: (
    ( PrimaryExpression
      / LPAR TypeName RPAR LWING InitializerList COMMA? RWING
      )
      ( LBRK Expression RBRK
      / LPAR ArgumentExpressionList? RPAR
      / DOT Identifier
      / PTR Identifier
      / INC
      / DEC
      )*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "PostfixExpression" ); }

ArgumentExpressionList = rhs: (
    AssignmentExpression (COMMA AssignmentExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ArgumentExpressionList" ); }

UnaryExpression = rhs: (
    PostfixExpression
    / INC UnaryExpression
    / DEC UnaryExpression
    / UnaryOperator CastExpression
    / SIZEOF (UnaryExpression / LPAR TypeName RPAR )
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "UnaryExpression" ); }

UnaryOperator = rhs: (
    AND
    / STAR
    / PLUS
    / MINUS
    / TILDA
    / BANG
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "UnaryOperator" ); }

CastExpression = rhs: (
    (LPAR TypeName RPAR)* UnaryExpression
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "CastExpression" ); }

MultiplicativeExpression = rhs: (
    CastExpression ((STAR / DIV / MOD) CastExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "MultiplicativeExpression" ); }

AdditiveExpression = rhs: (
    MultiplicativeExpression ((PLUS / MINUS) MultiplicativeExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "AdditiveExpression" ); }

ShiftExpression = rhs: (
    AdditiveExpression ((LEFT / RIGHT) AdditiveExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ShiftExpression" ); }

RelationalExpression = rhs: (
    ShiftExpression ((LE / GE / LT / GT) ShiftExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "RelationalExpression" ); }

EqualityExpression = rhs: (
    RelationalExpression ((EQUEQU / BANGEQU) RelationalExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EqualityExpression" ); }

ANDExpression = rhs: (
    EqualityExpression (AND EqualityExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ANDExpression" ); }

ExclusiveORExpression = rhs: (
    ANDExpression (HAT ANDExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ExclusiveORExpression" ); }

InclusiveORExpression = rhs: (
    ExclusiveORExpression (OR ExclusiveORExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "InclusiveORExpression" ); }

LogicalANDExpression = rhs: (
    InclusiveORExpression (ANDAND InclusiveORExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LogicalANDExpression" ); }

LogicalORExpression = rhs: (
    LogicalANDExpression (OROR LogicalANDExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LogicalORExpression" ); }

ConditionalExpression = rhs: (
    LogicalORExpression (QUERY Expression COLON LogicalORExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ConditionalExpression" ); }

AssignmentExpression = rhs: (
    UnaryExpression AssignmentOperator AssignmentExpression
    / ConditionalExpression
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "AssignmentExpression" ); }

AssignmentOperator = rhs: (
    EQU
    / STAREQU
    / DIVEQU
    / MODEQU
    / PLUSEQU
    / MINUSEQU
    / LEFTEQU
    / RIGHTEQU
    / ANDEQU
    / HATEQU
    / OREQU
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "AssignmentOperator" ); }

Expression = rhs: (
    AssignmentExpression (COMMA AssignmentExpression)*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Expression" ); }

ConstantExpression = rhs: (
    ConditionalExpression
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ConstantExpression" ); }


//-------------------------------------------------------------------------
//  A.1.1  Lexical elements
//  Tokens are: Keyword, Identifier, Constant, StringLiteral, Punctuator.
//  Tokens are separated by Spacing.
//-------------------------------------------------------------------------

Spacing = rhs: (
    ( WhiteSpace
      / LongComment
      / LineComment
      / Pragma
      )*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Spacing" ); }

WhiteSpace  = rhs: (
    [ \n\r\t\u000B\u000C] // 7.4.1.10
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "WhiteSpace" ); }

LongComment = rhs: (
    "/*" (!"*/"_)* "*/"   // 6.4.9
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LongComment" ); }

LineComment = rhs: (
    "//" (!"\n" _)*       // 6.4.9
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LineComment" ); }

Pragma      = rhs: (
    "#"  (!"\n" _)*       // Treat pragma as comment
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Pragma" ); }


//-------------------------------------------------------------------------
//  A.1.2  Keywords
//-------------------------------------------------------------------------

AUTO      = rhs: ( "auto"       !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "AUTO" ); }
BREAK     = rhs: ( "break"      !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "BREAK" ); }
CASE      = rhs: ( "case"       !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "CASE" ); }
CHAR      = rhs: ( "char"       !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "CHAR" ); }
CONST     = rhs: ( "const"      !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "CONST" ); }
CONTINUE  = rhs: ( "continue"   !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "CONTINUE" ); }
DEFAULT   = rhs: ( "default"    !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DEFAULT" ); }
DOUBLE    = rhs: ( "double"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DOUBLE" ); }
DO        = rhs: ( "do"         !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DO" ); }
ELSE      = rhs: ( "else"       !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ELSE" ); }
ENUM      = rhs: ( "enum"       !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ENUM" ); }
EXTERN    = rhs: ( "extern"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EXTERN" ); }
FLOAT     = rhs: ( "float"      !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "FLOAT" ); }
FOR       = rhs: ( "for"        !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "FOR" ); }
GOTO      = rhs: ( "goto"       !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "GOTO" ); }
IF        = rhs: ( "if"         !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "IF" ); }
INT       = rhs: ( "int"        !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "INT" ); }
INLINE    = rhs: ( "inline"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "INLINE" ); }
LONG      = rhs: ( "long"       !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LONG" ); }
REGISTER  = rhs: ( "register"   !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "REGISTER" ); }
RESTRICT  = rhs: ( "restrict"   !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "RESTRICT" ); }
RETURN    = rhs: ( "return"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "RETURN" ); }
SHORT     = rhs: ( "short"      !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "SHORT" ); }
SIGNED    = rhs: ( "signed"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "SIGNED" ); }
SIZEOF    = rhs: ( "sizeof"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "SIZEOF" ); }
STATIC    = rhs: ( "static"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "STATIC" ); }
STRUCT    = rhs: ( "struct"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "STRUCT" ); }
SWITCH    = rhs: ( "switch"     !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "SWITCH" ); }
TYPEDEF   = rhs: ( "typedef"    !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "TYPEDEF" ); }
UNION     = rhs: ( "union"      !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "UNION" ); }
UNSIGNED  = rhs: ( "unsigned"   !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "UNSIGNED" ); }
VOID      = rhs: ( "void"       !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "VOID" ); }
VOLATILE  = rhs: ( "volatile"   !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "VOLATILE" ); }
WHILE     = rhs: ( "while"      !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "WHILE" ); }
BOOL      = rhs: ( "_Bool"      !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "BOOL" ); }
COMPLEX   = rhs: ( "_Complex"   !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "COMPLEX" ); }
STDCALL   = rhs: ( "_stdcall"   !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "STDCALL" ); }
DECLSPEC  = rhs: ( "__declspec" !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DECLSPEC" ); }
ATTRIBUTE = rhs: ( "__attribute__" !IdChar Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ATTRIBUTE" ); }

Keyword = rhs: (
    ( "auto"
      / "break"
      / "case"
      / "char"
      / "const"
      / "continue"
      / "default"
      / "double"
      / "do"
      / "else"
      / "enum"
      / "extern"
      / "float"
      / "for"
      / "goto"
      / "if"
      / "int"
      / "inline"
      / "long"
      / "register"
      / "restrict"
      / "return"
      / "short"
      / "signed"
      / "sizeof"
      / "static"
      / "struct"
      / "switch"
      / "typedef"
      / "union"
      / "unsigned"
      / "void"
      / "volatile"
      / "while"
      / "_Bool"
      / "_Complex"
      / "_Imaginary"
      / "_stdcall"
      / "__declspec"
      / "__attribute__"
      )
    !IdChar
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Keyword" ); }


//-------------------------------------------------------------------------
//  A.1.3  Identifiers
//  The standard does not explicitly state that identifiers must be
//  distinct from keywords, but it seems so.
//-------------------------------------------------------------------------

Identifier = rhs: (
    !Keyword IdNondigit IdChar* Spacing
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Identifier" ); }

IdNondigit = rhs: (
    [a-z] / [A-Z] / [_]
    / UniversalCharacter
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "IdNondigit" ); }

IdChar = rhs: (
    [a-z] / [A-Z] / [0-9] / [_]
    / UniversalCharacter
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "IdChar" ); }


//-------------------------------------------------------------------------
//  A.1.4  Universal character names
//-------------------------------------------------------------------------

UniversalCharacter = rhs: (
    "\\u" HexQuad
    / "\\U" HexQuad HexQuad
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "UniversalCharacter" ); }

HexQuad = rhs: (
    HexDigit HexDigit HexDigit HexDigit
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HexQuad" ); }


//-------------------------------------------------------------------------
//  A.1.5  Constants
//-------------------------------------------------------------------------

Constant = rhs: (
    FloatConstant
    / IntegerConstant       // Note: can be a prefix of Float Constant!
    / EnumerationConstant
    / CharacterConstant
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Constant" ); }

IntegerConstant = rhs: (
    ( DecimalConstant
      / HexConstant
      / OctalConstant
      )
    IntegerSuffix? Spacing
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "IntegerConstant" ); }

DecimalConstant = rhs: (
    [1-9][0-9]*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DecimalConstant" ); }

OctalConstant   = rhs: (
    "0"[0-7]*
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "OctalConstant" ); }

HexConstant     = rhs: (
    HexPrefix HexDigit+
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HexConstant" ); }

HexPrefix       = rhs: (
    "0x" / "0X"
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HexPrefix" ); }

HexDigit        = rhs: (
    [a-f] / [A-F] / [0-9]
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HexDigit" ); }

IntegerSuffix = rhs: (
    [uU] Lsuffix?
    / Lsuffix [uU]?
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "IntegerSuffix" ); }

Lsuffix = rhs: (
    "ll"
    / "LL"
    / [lL]
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Lsuffix" ); }

FloatConstant = rhs: (
    ( DecimalFloatConstant
      / HexFloatConstant
      )
    FloatSuffix? Spacing
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "FloatConstant" ); }

DecimalFloatConstant = rhs: (
    Fraction Exponent?
    / [0-9]+ Exponent
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DecimalFloatConstant" ); }

HexFloatConstant = rhs: (
    HexPrefix HexFraction BinaryExponent
    / HexPrefix HexDigit+ BinaryExponent
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HexFloatConstant" ); }

Fraction = rhs: (
    [0-9]* "." [0-9]+
    / [0-9]+ "."
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Fraction" ); }

HexFraction = rhs: (
    HexDigit* "." HexDigit+
    / HexDigit+ "."
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HexFraction" ); }

Exponent = rhs: (
    [eE][+\-]? [0-9]+
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Exponent" ); }

BinaryExponent = rhs: (
    [pP][+\-]? [0-9]+
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "BinaryExponent" ); }

FloatSuffix = rhs: (
    [flFL]
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "FloatSuffix" ); }

EnumerationConstant = rhs: (
    Identifier
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EnumerationConstant" ); }

CharacterConstant = rhs: (
    "L"? "'" Char+ "'" Spacing
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "CharacterConstant" ); }

Char = rhs: (
    Escape / !['\n\\] _
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Char" ); }

Escape = rhs: (
    SimpleEscape
    / OctalEscape
    / HexEscape
    / UniversalCharacter
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "Escape" ); }

SimpleEscape = rhs: (
    "\\" ['\"?\\abfnrtv]
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "SimpleEscape" ); }
OctalEscape  = rhs: (
    "\\" [0-7][0-7]?[0-7]?
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "OctalEscape" ); }
HexEscape    = rhs: (
    "\\x" HexDigit+
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HexEscape" ); }


//-------------------------------------------------------------------------
//  A.1.6  String Literals
//-------------------------------------------------------------------------

StringLiteral = rhs: (
    "L"? ["] StringChar+ ["]
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "StringLiteral" ); }

StringChar = rhs: (
    Escape / ![\"\n\\] _
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "StringChar" ); }


//-------------------------------------------------------------------------
//  A.1.7  Punctuators
//-------------------------------------------------------------------------

LBRK       = rhs: ( "["         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LBRK" ); }
RBRK       = rhs: ( "]"         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "RBRK" ); }
LPAR       = rhs: ( "("         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LPAR" ); }
RPAR       = rhs: ( ")"         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "RPAR" ); }
LWING      = rhs: ( "{"         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LWING" ); }
RWING      = rhs: ( "}"         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "RWING" ); }
DOT        = rhs: ( "."         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DOT" ); }
PTR        = rhs: ( "->"        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "PTR" ); }
INC        = rhs: ( "++"        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "INC" ); }
DEC        = rhs: ( "--"        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DEC" ); }
AND        = rhs: ( "&"  ![&]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "AND" ); }
STAR       = rhs: ( "*"  ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "STAR" ); }
PLUS       = rhs: ( "+"  ![+=]  Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "PLUS" ); }
MINUS      = rhs: ( "-"  ![\-=>]Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "MINUS" ); }
TILDA      = rhs: ( "~"         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "TILDA" ); }
BANG       = rhs: ( "!"  ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "BANG" ); }
DIV        = rhs: ( "/"  ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DIV" ); }
MOD        = rhs: ( "%"  ![=>]  Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "MOD" ); }
LEFT       = rhs: ( "<<" ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LEFT" ); }
RIGHT      = rhs: ( ">>" ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "RIGHT" ); }
LT         = rhs: ( "<"  ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LT" ); }
GT         = rhs: ( ">"  ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "GT" ); }
LE         = rhs: ( "<="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LE" ); }
GE         = rhs: ( ">="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "GE" ); }
EQUEQU     = rhs: ( "=="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EQUEQU" ); }
BANGEQU    = rhs: ( "!="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "BANGEQU" ); }
HAT        = rhs: ( "^"  ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HAT" ); }
OR         = rhs: ( "|"  ![=]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "OR" ); }
ANDAND     = rhs: ( "&&"        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ANDAND" ); }
OROR       = rhs: ( "||"        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "OROR" ); }
QUERY      = rhs: ( "?"         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "QUERY" ); }
COLON      = rhs: ( ":"  ![>]   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "COLON" ); }
SEMI       = rhs: ( ";"         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "SEMI" ); }
ELLIPSIS   = rhs: ( "..."       Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ELLIPSIS" ); }
EQU        = rhs: ( "="  !"="   Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EQU" ); }
STAREQU    = rhs: ( "*="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "STAREQU" ); }
DIVEQU     = rhs: ( "/="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "DIVEQU" ); }
MODEQU     = rhs: ( "%="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "MODEQU" ); }
PLUSEQU    = rhs: ( "+="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "PLUSEQU" ); }
MINUSEQU   = rhs: ( "-="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "MINUSEQU" ); }
LEFTEQU    = rhs: ( "<<="       Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "LEFTEQU" ); }
RIGHTEQU   = rhs: ( ">>="       Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "RIGHTEQU" ); }
ANDEQU     = rhs: ( "&="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "ANDEQU" ); }
HATEQU     = rhs: ( "^="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "HATEQU" ); }
OREQU      = rhs: ( "|="        Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "OREQU" ); }
COMMA      = rhs: ( ","         Spacing ) { return cPEG_ext.parserDefaultAction( text(), rhs, "COMMA" ); }

_        = rhs: (
     .
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EOT" ); }

EOT        = rhs: (
     !_
    ) { return cPEG_ext.parserDefaultAction( text(), rhs, "EOT" ); }
