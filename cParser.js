



var cParser = (function() {
    
    var resultSteps;
    var declarations;
    var typedefsList;
    var enumsList;
    var structsUnionsList;
    var functionsList;
    
    var configuration = {
        supportLongLong: true,
    };
    
    var defaultTypedefsList = {
        $longDoubleComplex: { size: 0 },
        $doubleComplex:     { size: 0 },
        $floatComplex:      { size: 0 },
        $longDouble:        { size: 0 },
        $double:            { size: 0 },
        $float:             { size: 0 },
        $unsignedLongLong:  { size: 0 },
        $signedLongLong:    { size: 0 },
        $unsignedLong:      { size: 4 },
        $signedLong:        { size: 4 },
        $unsignedShort:     { size: 2 },
        $signedShort:       { size: 2 },
        $unsignedChar:      { size: 1 },
        $signedChar:        { size: 1 },
        $char:              { size: 1 },
        $unsignedInt:       { size: 2 },
        $signedInt:         { size: 2 },
        $bool:              { size: 1 },
        $void:              { size: 0 },
    };
    
    return { parse:  parse,
             reset:  reset,
             toJSON: toJSON };
    
    function toJSON( key )
    {
        return { declarations: declarations };
    }
    
    function reset()
    {
        resetVariables();
        cPegjsParser.parse.reset( callback );
    }
    
    function resetVariables()
    {
        resultSteps       = [];
        declarations      = [];
        typedefsList      = copyObjProperties( {}, defaultTypedefsList );
        enumsList         = {};
        structsUnionsList = {};
        functionsList     = {};
        
        for( var keys in typedefsList )
        {
            typedefsList[keys]._offset = 0;
        }
    }
    
    function copyObjProperties( desObj, srcObj )
    {
        var key;
        
        if( (  ( desObj instanceof Array ) &&
              !( srcObj instanceof Array ) ) ||
            (  ( desObj instanceof Object ) &&
              !( srcObj instanceof Object ) ) )
        {
            throw "Error. Different types.";
        }
        
        for( key in srcObj )
        {
            if( srcObj[key] instanceof Array )
            {
                desObj[key] = copyObjProperties( [], srcObj[key] );
            }
            else if( srcObj[key] instanceof Object )
            {
                desObj[key] = copyObjProperties( {}, srcObj[key] );
            }
            else
            {
                desObj[key] = srcObj[key];
            }
        }
        return desObj;
    }
    
    function parse( input )
    {
        var result;
        var lDeclarations;
        
        // try
        // {
            cPegjsParser.parse( input );
            return postProcessing();
        // }
        // catch( error )
        // {
            // result = { status: 1 };
        // }
        
        return result;
    }
    
    // function decimalToMemory( decimal )
    // function memoryToDecimal( memory )
    
    function calcRpnExpression( rpnExpression )//descrArray )
    {
        var i;
        var j;
        var numberOfOperands;
        var operands;
        var result;
        
        while( 1 != descrArray.length )
        {
            for( i = 0; i < descrArray.length; i++ )
            {
                if( true !== descrArray[i]._isOperation )
                {
                    continue;
                }
                
                numberOfOperands = descrArray[i + 1]._operands;
                operands = [];
                
                for( j = numberOfOperands; j >= 1; j-- )
                {
                    if( "IntegerConstant" == descrArray[i - j]._isA )
                    {
                        operands.push( descrArray[i - j]._value );
                    }
                    else
                    {
                        throw "Not implemented.";
                    }
                }
                
                switch( descrArray[i]._isA )
                {
                    case "STAR":
                        result = operands[0] * operands[1];
                        break;
                    case "DIV":
                        result = operands[0] / operands[1];
                        break;
                    case "MOD":
                        result = operands[0] % operands[1];
                        break;
                    case "PLUS":
                        result = operands[0] + operands[1];
                        break;
                    case "MINUS":
                        result = operands[0] - operands[1];
                        break;
                    case "LEFT":
                        result = operands[0] << operands[1];
                        break;
                    case "RIGHT":
                        result = operands[0] >> operands[1];
                        break;
                    case "LE":
                        result = operands[0] <= operands[1];
                        break;
                    case "GE":
                        result = operands[0] >= operands[1];
                        break;
                    case "LT":
                        result = operands[0] < operands[1];
                        break;
                    case "GT":
                        result = operands[0] > operands[1];
                        break;
                    case "EQUEQU":
                        result = operands[0] == operands[1];
                        break;
                    case "BANGEQU":
                        result = operands[0] != operands[1];
                        break;
                    case "AND":
                        result = operands[0] & operands[1];
                        break;
                    case "HAT":
                        result = operands[0] ^ operands[1];
                        break;
                    case "OR":
                        result = operands[0] | operands[1];
                        break;
                    case "ANDAND":
                        result = operands[0] && operands[1];
                        break;
                    case "OROR":
                        result = operands[0] || operands[1];
                        break;
                    default:
                        throw "Not implemented.";
                        break;
                }
                
                descrArray.splice( i - numberOfOperands, numberOfOperands + 2, { _isA: "IntegerConstant", _value: result } );
                break;
            }
        }
    }
    
    function addRpnOperation( orignialRpnExpression, newOperands, operation )
    {
        if( 1 != newOperands.length )
        {
            throw "Not implemented.";
        }
        
        orignialRpnExpression.value = orignialRpnExpression.value.concat( newOperands[0].value );
        orignialRpnExpression.value.push( { isA:       "RpnOperation",
                                            operation: operation,
                                            operands:  1 + newOperands.length } );
        
        return orignialRpnExpression;
    }
    
    function postProcessing()
    {
        return   { status:            0,
                   resultSteps:       resultSteps,
                   declarations:      declarations,
                   typedefsList:      typedefsList,
                   enumsList:         enumsList,
                   structsUnionsList: structsUnionsList,
                   functionsList:     functionsList };
    }
    
    function callback( lhs, rhs, from )
    {
        var descr;
        var array;
        var value;
        var i;
        var j;
        
        function copyNotLongProperties( dstObj, srcObj )
        {
            var key;
            var isLongCount;
            
            isLongCount = 0;
            
            for( key in srcObj )
            {
                if( "isLong" == key )
                {
                    isLongCount++;
                    continue;
                }
                dstObj[key] = srcObj[key];
            }
            
            return isLongCount;
        }
        
        function setLongType( descr, longCounter )
        {
            switch( longCounter )
            {
                case 0:
                    break;
                case 1:
                    descr.isLong = true;
                    break;
                default:
                    descr.isLongLong = true;
                    break;
            }
            
            return;
        }
        
        function getIntegerConstantType( isDecimalConstant, suffix, descr )
        {
            var checkSteps;
            var currentStep;
            var lastResult;
            
            function getMinMaxDecimals( isDecimalConstant, value, descr )
            {
                var typeSize;
                var result;
                
                if( ( true === descr.isUnsigned ) && ( true === descr.isInt ) )
                {
                    typeSize = defaultTypedefsList.$unsignedInt.size;
                }
                else if( ( true === descr.isUnsigned ) && ( true === descr.isLong ) )
                {
                    typeSize = defaultTypedefsList.$unsignedLong.size;
                }
                else if( ( true === descr.isUnsigned ) && ( true === descr.isLongLong ) )
                {
                    typeSize = defaultTypedefsList.$unsignedLongLong.size;
                }
                else if( true === descr.isInt )
                {
                    typeSize = defaultTypedefsList.$signedInt.size;
                }
                else if( true === descr.isLong )
                {
                    typeSize = defaultTypedefsList.$signedLong.size;
                }
                else if( true === descr.isLongLong )
                {
                    typeSize = defaultTypedefsList.$signedLongLong.size;
                }
                else
                {
                    throw "Not implemented.";
                }
                
                result = {};
                result.min = 0;
                result.max = 0;
                
                return result;
            }
            
            function evaluateStep( isDecimalConstant, value, descr )
            {
                var result;
                var decimals;
                
                result = {};
                result.overflows = true;
                result.stepDescr = descr;
                
                decimals = getMinMaxDecimals( isDecimalConstant, value, descr );
                result.truncatedValue = decimals.value;
                
                if( ( decimals.value >= decimals.min ) &&
                    ( decimals.value <= decimals.max ) )
                {
                    result.overflows = false;
                }
                
                if( decimals.value >= decimals.max )
                {
                    result.truncatedValue = decimals.max;
                }
                else if( decimals.value <= decimals.min )
                {
                    result.truncatedValue = decimals.min;
                }
                
                return result;
            }
            
            checkSteps = {
                stepFirst___________: { nextStep: 0, skip: true, descr: {                                    } },
                stepInt_____________: { nextStep: 0, skip: true, descr: { isInt:      true                   } },
                stepUnsignedInt_____: { nextStep: 0, skip: true, descr: { isInt:      true, isUnsigned: true } },
                stepLong____________: { nextStep: 0, skip: true, descr: { isLong:     true                   } },
                stepUnsignedLong____: { nextStep: 0, skip: true, descr: { isLong:     true, isUnsigned: true } },
                stepLongLong________: { nextStep: 0, skip: true, descr: { isLongLong: true                   } },
                stepUnsignedLongLong: { nextStep: 0, skip: true, descr: { isLongLong: true, isUnsigned: true } }
            };
            
            checkSteps.stepFirst___________.nextStep = checkSteps.stepInt_____________;
            checkSteps.stepInt_____________.nextStep = checkSteps.stepUnsignedInt_____;
            checkSteps.stepUnsignedInt_____.nextStep = checkSteps.stepLong____________;
            checkSteps.stepLong____________.nextStep = checkSteps.stepUnsignedLong____;
            checkSteps.stepUnsignedLong____.nextStep = checkSteps.stepLongLong________;
            checkSteps.stepLongLong________.nextStep = checkSteps.stepUnsignedLongLong;
            
            switch( suffix )
            {
                default:
                    checkSteps.stepInt_____________.skip = false;
                    checkSteps.stepLong____________.skip = false;
                    checkSteps.stepLongLong________.skip = false;
                    if( !isDecimalConstant )
                    {
                        checkSteps.stepUnsignedInt_____.skip = false;
                        checkSteps.stepUnsignedLong____.skip = false;
                        checkSteps.stepUnsignedLongLong.skip = false;
                    }
                    break;
                case "U":
                    checkSteps.stepUnsignedInt_____.skip = false;
                    checkSteps.stepUnsignedLong____.skip = false;
                    checkSteps.stepUnsignedLongLong.skip = false;
                    break;
                case "L":
                    checkSteps.stepLong____________.skip = false;
                    checkSteps.stepLongLong________.skip = false;
                    if( !isDecimalConstant )
                    {
                        checkSteps.stepUnsignedLong____.skip = false;
                        checkSteps.stepUnsignedLongLong.skip = false;
                    }
                    break;
                case "UL":
                    checkSteps.stepUnsignedLong____.skip = false;
                    checkSteps.stepUnsignedLongLong.skip = false;
                    break;
                case "LL":
                    checkSteps.stepLongLong________.skip = false;
                    if( !isDecimalConstant )
                    {
                        checkSteps.stepUnsignedLongLong.skip = false;
                    }
                    break;
                case "ULL":
                    checkSteps.stepUnsignedLongLong.skip = false;
                    break;
            }
            
            if( !configuration.supportLongLong )
            {
                checkSteps.stepLongLong________.skip = true;
                checkSteps.stepUnsignedLongLong.skip = true;
            }
            
            currentStep = checkSteps.stepFirst___________;
            do
            {
                if( !currentStep.skip )
                {
                    lastResult = evaluateStep( isDecimalConstant, descr.value, currentStep.descr );
                    if( !lastResult.overflows )
                    {
                        break;
                    }
                }
                
                currentStep = currentStep.nextStep;
                
            }while( 0 != currentStep.nextStep );
            
            descr.value = lastResult.truncatedValue;
            descr = copyObjProperties( descr, lastResult.stepDescr );
            
            return descr;
        }
        
        resultSteps.push( { lhs: lhs, rhs: rhs, from: from } );
        
        switch( from )
        {
            /*********************************************
            **********************************************
            **
            **      A.1         Lexical grammar
            **          A.1.1   Lexical elements
            **          A.1.2   Keywords
            **          A.1.3   Identifiers
            **          A.1.4   Universal character names
            **          A.1.5   Constants
            **          A.1.6   String literals
            **          A.1.7   Punctuators
            **          A.1.8   Header names
            **          A.1.9   Preprocessing numbers
            **      A.2         Phrase structure grammar
            **          A.2.1   Expressions
            **          A.2.2   Declarations
            **          A.2.3   Statements
            **          A.2.4   External definitions
            **      A.3         Preprocessing directives
            **
            **********************************************
            *********************************************/
            
            case "Identifier":
                //----------------------------------------------------------------------------------------------------
                //  A.1.3 - 6.4.2.1
                //  Identifier = !Keyword IdNondigit IdChar* Spacing
                //                  0-        1        2,i      3
                //----------------------------------------------------------------------------------------------------
                value = lhs.text.trim();
                lhs.sem = { value: value, isA: "Identifier" };
                break;
            case "Constant":
                //----------------------------------------------------------------------------------------------------
                //  A.1.5 - 6.4.4
                //  Constant = IntegerConstant / FloatConstant / EnumerationConstant / CharacterConstant
                //                   -                 -                   -                  -
                //----------------------------------------------------------------------------------------------------
                lhs.sem = rhs.sem;
                break;
            case "IntegerConstant":
                //----------------------------------------------------------------------------------------------------
                //  A.1.5 - 6.4.4.1
                //  IntegerConstant = ( DecimalConstant / HexConstant / OctalConstant ) IntegerSuffix? Spacing
                //                            0                0              0               1?          2
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.value = parseInt( lhs.text );
                if( "OctalConstant" == rhs[0].isA )
                {
                    descr.value = parseInt( lhs.text, 8 );
                }
                if( null === rhs[1] )
                {
                    value = "";
                }
                else
                {
                    value = rhs[1].text;
                    value = value.toUpperCase();
                    if( "LU" == value )
                    {
                        value = "UL";
                    }
                    if( "LLU" == value )
                    {
                        value = "ULL";
                    }
                }
                
                descr = getIntegerConstantType( "DecimalConstant" == rhs[0].isA, value, descr );
                
                lhs.sem = { value: descr, isA: "IntegerConstantDescr" };
                break;
            case "FloatConstant":
                //----------------------------------------------------------------------------------------------------
                //  A.1.5 - 6.4.4.2
                //  FloatConstant = ( DecimalFloatConstant / HexFloatConstant ) FloatSuffix? Spacing
                //                             0                    0                1?         2
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.value = parseFloat( lhs.text );
                if( null === rhs[1] )
                {
                    descr.isDouble = true;
                }
                else switch( rhs[1].text )
                {
                    case "l":
                    case "L":
                        descr.isDouble = true;
                        descr.isLong = true;
                        break;
                    default:
                        descr.isFloat = true;
                        break;
                }
                lhs.sem = { value: descr, isA: "FloatConstantDescr" };
                break;
            case "EnumerationConstant":
                //----------------------------------------------------------------------------------------------------
                //  A.1.5 - 6.4.4.3
                //  EnumerationConstant = Identifier
                //                            -
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.value = rhs.sem.value;
                descr.isUnknownType = true;
                lhs.sem = { value: descr, isA: "EnumerationConstantDescr" };
                break;
            case "CharacterConstant":
                //----------------------------------------------------------------------------------------------------
                //  A.1.5 - 6.4.4.4
                //  CharacterConstant = "L"? "'" Char+ "'" Spacing
                //                       0?   1   2,i   3     4
                //----------------------------------------------------------------------------------------------------
                descr = {};
                if( null !== rhs[0] )
                {
                    descr.isWchar = true;
                }
                value = lhs.text.trim();
                value = value.substring( 1, value.length - 1 );
                descr.value = value;
                lhs.sem = { value: descr, isA: "CharacterConstantDescr" };
                break;
            case "StringLiteral":
                //----------------------------------------------------------------------------------------------------
                //  A.1.6 - 6.4.5
                //  StringLiteral = "L"? ["] StringChar+ ["]
                //                   0?   1      2,i      3
                //----------------------------------------------------------------------------------------------------
                descr = {};
                if( null !== rhs[0] )
                {
                    descr.isWchar = true;
                }
                value = lhs.text.trim();
                value = value.substring( 1, value.length - 1 );
                descr.value = value;
                lhs.sem = { value: descr, isA: "StringLiteralDescr" };
                break;
            
            /*********************************************
            **********************************************
            **
            **      A.2.1   Expressions
            **
            **********************************************
            *********************************************/
            
            case "PrimaryExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.1
                //  PrimaryExpression = Identifier / Constant / StringLiteral / LPAR Expression RPAR
                //                          -            -           -           0      1        2 
                //----------------------------------------------------------------------------------------------------
                if( ( rhs instanceof Array )  &&
                    ( "Expression" == rhs[1].isA ) )
                {
                    value = rhs[1].sem.value;
                }
                else
                {
                    value = [ rhs.sem ];
                }
                lhs.sem = { value: value, isA: "RpnExpression" };
                break;
            case "PostfixExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.2
                //  PostfixExpression = ( PrimaryExpression / LPAR TypeName RPAR LWING InitializerList COMMA? RWING )
                //                               0             0,0    0,1   0,2   0,3       0,4         0,5?   0,6
                //                      ( LBRK Expression RBRK / LPAR ArgumentExpressionList? RPAR /
                //                       1,i,0   1,i,1    1,i,2  1,i,0        1,i,1?          1,i,2
                //                        DOT Identifier / PTR Identifier / INC / DEC )*
                //                      1,i,0   1,i,1     1,i,0   1,i,1     1,i   1,i
                //----------------------------------------------------------------------------------------------------
                if( !( rhs[0] instanceof Array ) &&
                     ( "PrimaryExpression" == rhs[0].isA ) &&
                     ( 0 == rhs[1].length ) )
                {
                    lhs.sem = rhs[0].sem;
                }
                else
                {
                    throw "Not implemented.";
                }
                break;
            case "ArgumentExpressionList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.2
                //  ArgumentExpressionList = AssignmentExpression ( COMMA AssignmentExpression )*
                //                                     0            1,i,0        1,i,1
                //----------------------------------------------------------------------------------------------------
                if( 0 == rhs[1].length )
                {
                    lhs.sem = rhs[0].sem;
                }
                else
                {
                    throw "Not implemented.";
                }
                break;
            case "UnaryExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.3
                //  UnaryExpression = PostfixExpression / INC UnaryExpression / DEC UnaryExpression /
                //                           -             0         1           0         1
                //                    UnaryOperator CastExpression / SIZEOF ( UnaryExpression / LPAR TypeName RPAR )
                //                         0              1            0             1          1,0    1,1     1,2
                //----------------------------------------------------------------------------------------------------
                if( !( rhs instanceof Array ) &&
                     ( "PostfixExpression" == rhs.isA ) )
                {
                    lhs.sem = rhs.sem;
                }
                else
                {
                    throw "Not implemented.";
                }
                break;
            case "UnaryOperator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.3
                //  UnaryOperator = AND / STAR / PLUS / MINUS / TILDA / BANG
                //                   -      -      -      -       -      -
                //----------------------------------------------------------------------------------------------------
                lhs.sem = { value: rhs.isA, isA: "UnaryOperator" };
                break;
            case "CastExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.4
                //  CastExpression = ( LPAR TypeName RPAR )* UnaryExpression
                //                    0,i,0   0,i,1  0,i,2         1
                //----------------------------------------------------------------------------------------------------
                if( 0 == rhs[0].length )
                {
                    lhs.sem = rhs[1].sem;
                }
                else
                {
                    throw "Not implemented.";
                }
                break;
            case "MultiplicativeExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.5
                //  MultiplicativeExpression = CastExpression ( ( STAR / DIV / MOD ) CastExpression )*
                //                                   0           1,i,0  1,i,0  1,i,0     1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "AdditiveExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.6
                //  AdditiveExpression = MultiplicativeExpression ( ( PLUS / MINUS ) MultiplicativeExpression )*
                //                                 0                 1,i,0   1,i,0           1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "ShiftExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.7
                //  ShiftExpression = AdditiveExpression ( ( LEFT / RIGHT ) AdditiveExpression )*
                //                            0             1,i,0   1,i,0         1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "RelationalExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.8
                //  RelationalExpression = ShiftExpression ( ( LE / GE / LT / GT ) ShiftExpression )*
                //                                 0        1,i,0 1,i,0 1,i,0 1,i,0     1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "EqualityExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.9
                //  EqualityExpression = RelationalExpression ( ( EQUEQU / BANGEQU ) RelationalExpression )*
                //                                 0               1,i,0   1,i,0           1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "ANDExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.10
                //  ANDExpression = EqualityExpression ( AND EqualityExpression )*
                //                          0          1,i,0       1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "ExclusiveORExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.11
                //  ExclusiveORExpression = ANDExpression ( HAT ANDExpression )*
                //                                0       1,i,0     1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "InclusiveORExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.12
                //  InclusiveORExpression = ExclusiveORExpression ( OR ExclusiveORExpression )*
                //                                   0           1,i,0       1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "LogicalANDExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.13
                //  LogicalANDExpression = InclusiveORExpression ( ANDAND InclusiveORExpression )*
                //                                   0              1,i,0        1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "LogicalORExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.14
                //  LogicalORExpression = LogicalANDExpression ( OROR LogicalANDExpression )*
                //                                 0            1,i,0        1,i,1
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "ConditionalExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.15
                //  ConditionalExpression = LogicalORExpression ( QUERY Expression COLON LogicalORExpression )*
                //                                  0             1,i,0    1,i,1   1,i,2        1,i,3
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem;
                for( i = 0; i < rhs[1].length; i++ )
                {
                    value = addRpnOperation( value,
                                             [ rhs[1][i][1].sem,
                                               rhs[1][i][3].sem ],
                                             rhs[1][i][0].isA );
                }
                lhs.sem = value;
                break;
            case "AssignmentExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.16
                //  AssignmentExpression = UnaryExpression AssignmentOperator AssignmentExpression /
                //                                 0               1                    2
                //                         ConditionalExpression
                //                                   -
                //----------------------------------------------------------------------------------------------------
                if( !( rhs instanceof Array ) &&
                     ( "ConditionalExpression" == rhs.isA ) )
                {
                    lhs.sem = rhs.sem;
                }
                else
                {
                    throw "Not implemented.";
                }
                break;
            case "AssignmentOperator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.16
                //  AssignmentOperator = EQU / STAREQU / DIVEQU / MODEQU / PLUSEQU / MINUSEQU /
                //                        -       -        -        -         -          -
                //                       LEFTEQU / RIGHTEQU / ANDEQU / HATEQU / OREQU
                //                          -         -          -       -        -
                //----------------------------------------------------------------------------------------------------
                lhs.sem = { value: rhs.isA, isA: "AssignmentOperator" };
                break;
            case "Expression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.5.17
                //  Expression = AssignmentExpression ( COMMA AssignmentExpression )*
                //                        0             1,i,0        1,i,1
                //----------------------------------------------------------------------------------------------------
                if( 0 == rhs[1].length )
                {
                    lhs.sem = rhs[0].sem;
                }
                else
                {
                    throw "Not implemented.";
                }
                break;
            case "ConstantExpression":
                //----------------------------------------------------------------------------------------------------
                //  A.2.1 - 6.6
                //  ConstantExpression = ConditionalExpression
                //                                -
                //----------------------------------------------------------------------------------------------------
                lhs.sem = rhs.sem;
                break;
            
            /*********************************************
            **********************************************
            **
            **      A.2.2   Declarations
            **
            **********************************************
            *********************************************/
            
            case "Declaration":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7
                //  Declaration = DeclarationSpecifiers InitDeclaratorList? SEMI
                //                         0                     1?          2
                //----------------------------------------------------------------------------------------------------
                array = [];
                if( null === rhs[1] )
                {
                    array.push( rhs[0].sem.value );
                }
                else
                {
                    for( i = 0; i < rhs[1].sem.value.length; i++ )
                    {
                        value = rhs[1].sem.value[i];
                        j = value.pop();
                        value = value.concat( [ rhs[0].sem.value ] );
                        value.push( j );
                        array.push( value );
                    }
                }
                lhs.sem = { value: array, isA: "DeclarationArray" };
                break;
            case "DeclarationSpecifiers":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7
                //  DeclarationSpecifiers = ( ( StorageClassSpecifier / TypeQualifier / FunctionSpecifier )*
                //                                      0,i                  0,i               0,i
                //                            TypedefName ( StorageClassSpecifier / TypeQualifier / FunctionSpecifier )* ) /
                //                                 1                 2,i                 2,i               2,i
                //                          ( StorageClassSpecifier / TypeSpecifier / TypeQualifier / FunctionSpecifier )+
                //                                     i                   i               i                  i
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.isA = "TYPE";
                value = 0;
                if( ( 2 <= rhs.length ) && ( "TypedefName" == rhs[1].isA ) )
                {
                    for( i = 0; i < rhs[0].length; i++ )
                    {
                        value += copyNotLongProperties( descr, rhs[0][i].sem.value );
                    }
                    
                    descr.typedefName = rhs[1].sem.value;
                    
                    for( i = 0; i < rhs[2].length; i++ )
                    {
                        value += copyNotLongProperties( descr, rhs[2][i].sem.value );
                    }
                }
                else
                {
                    for( i = 0; i < rhs.length; i++ )
                    {
                        value += copyNotLongProperties( descr, rhs[i].sem.value );
                    }
                }
                
                setLongType( descr, value );
                
                lhs.sem = { value: descr, isA: "DeclarationSpecifiersDescr" };
                break;
            case "InitDeclaratorList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7
                //  InitDeclaratorList = InitDeclarator ( COMMA InitDeclarator )*
                //                             0          1,i,0     1,i,1
                //----------------------------------------------------------------------------------------------------
                array = [];
                array.push( rhs[0].sem.value );
                for( i = 0; i < rhs[1].length; i++ )
                {
                    array.push( rhs[1][i][1].sem.value );
                }
                lhs.sem = { value: array, isA: "InitDeclaratorListArray" };
                break;
            case "InitDeclarator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7
                //  InitDeclarator = Declarator ( EQU Initializer )?
                //                       0       1?,0     1?,1
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.isA = "InitializerDescr";
                if( null !== rhs[1] )
                {
                    throw "Not implemented.";
                }
                else
                {
                    descr.value = [];
                }
                array = rhs[0].sem.value;
                array = array.concat( descr );
                lhs.sem = { value: array, isA: "InitDeclaratorArray" };
                break;
            case "StorageClassSpecifier":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.1
                //  StorageClassSpecifier = TYPEDEF / EXTERN / STATIC / AUTO / REGISTER /
                //                             -        -        -       -       -  
                //                          ATTRIBUTE LPAR LPAR ( !RPAR _ )* RPAR RPAR
                //                              0       1    2  3,i,0 3,i,1   4    5
                //----------------------------------------------------------------------------------------------------
                descr = {};
                switch( rhs.isA )
                {
                    case "TYPEDEF":
                        descr.isTypedef = true;
                        break;
                    case "EXTERN":
                        descr.isExtern = true;
                        break;
                    case "STATIC":
                        descr.isStatic = true;
                        break;
                    case "AUTO":
                        descr.isAuto = true;
                        break;
                    case "REGISTER":
                        descr.isRegister = true;
                        break;
                }
                lhs.sem = { value: descr, isA: "StorageClassSpecifierDescr" };
                break;
            case "TypeSpecifier":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2
                //  TypeSpecifier = VOID / CHAR / SHORT / INT / LONG / FLOAT / DOUBLE / SIGNED /
                //                    -      -      -      -      -      -       -        -
                //                  UNSIGNED / BOOL / COMPLEX / StructOrUnionSpecifier / EnumSpecifier
                //                      -        -       -               -                    -
                //----------------------------------------------------------------------------------------------------
                descr = {};
                switch( rhs.isA )
                {
                    case "VOID":
                        descr.isVoid = true;
                        break;
                    case "CHAR":
                        descr.isChar = true;
                        break;
                    case "SHORT":
                        descr.isShort = true;
                        break;
                    case "INT":
                        descr.isInt = true;
                        break;
                    case "LONG":
                        descr.isLong = true;
                        break;
                    case "FLOAT":
                        descr.isFloat = true;
                        break;
                    case "DOUBLE":
                        descr.isDouble = true;
                        break;
                    case "SIGNED":
                        descr.isSigned = true;
                        break;
                    case "UNSIGNED":
                        descr.isUnsigned = true;
                        break;
                    case "BOOL":
                        descr.isBool = true;
                        break;
                    case "COMPLEX":
                        descr.isComplex = true;
                        break;
                    case "StructOrUnionSpecifier":
                        descr.isStructUnion = rhs.sem.value;
                        break;
                    case "EnumSpecifier":
                        descr.isEnum = rhs.sem.value;
                        break;
                }
                lhs.sem = { value: descr, isA: "TypeSpecifierDescr" };
                break;
            case "StructOrUnionSpecifier":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.1
                //  StructOrUnionSpecifier = StructOrUnion ( Identifier? LWING StructDeclaration+ RWING / Identifier )
                //                                0             1,0?      1,1        1,2,i         1,3        1
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.isUnion = rhs[0].sem.value.isUnion;
                descr.hasTag = false;
                descr.tag = "";
                descr.members = [];
                if( rhs[1] instanceof Array )
                {
                    if( null !== rhs[1][0] )
                    {
                        descr.hasTag = true;
                        descr.tag = rhs[1][0].sem.value;
                    }
                    for( i = 0; i < rhs[1][2].length; i++ )
                    {
                        descr.members = descr.members.concat( rhs[1][2][i].sem.value );
                    }
                }
                else
                {
                    descr.hasTag = true;
                    descr.tag = rhs[1].sem.value;
                }
                lhs.sem = { value: descr, isA: "StructOrUnionSpecifierDescr" };
                break;
            case "StructOrUnion":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.1
                //  StructOrUnion = STRUCT / UNION
                //                    -        -
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.isUnion = ( "UNION" == rhs.isA ) ? true : false;
                lhs.sem = { value: descr, isA: "StructOrUnionDescr" };
                break;
            case "StructDeclaration":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.1
                //  StructDeclaration = SpecifierQualifierList StructDeclaratorList SEMI
                //                                0                     1            2
                //----------------------------------------------------------------------------------------------------
                array = [];
                for( i = 0; i < rhs[1].sem.value.length; i++ )
                {
                    array[i] = rhs[1].sem.value[i];
                    array[i].splice( array[i].length - 1, 0, rhs[0].sem.value );
                }
                lhs.sem = { value: array, isA: "StructDeclarationArray" };
                break;
            case "SpecifierQualifierList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.1
                //  SpecifierQualifierList = ( TypeQualifier* TypedefName TypeQualifier* ) /
                //                                  0,i            1           2,i
                //                           ( TypeSpecifier / TypeQualifier )+
                //                                  i                i
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.isA = "TYPE";
                value = 0;
                
                if( rhs[0] instanceof Array )
                {
                    for( i = 0; i < rhs[0].length; i++ )
                    {
                        descr = copyObjProperties( descr, rhs[0][i].sem.value );
                    }
                    
                    descr.typedefName = rhs[1].sem.value;
                    
                    for( i = 0; i < rhs[2].length; i++ )
                    {
                        descr = copyObjProperties( descr, rhs[2][i].sem.value );
                    }
                }
                else
                {
                    for( i = 0; i < rhs.length; i++ )
                    {
                        value += copyNotLongProperties( descr, rhs[i].sem.value );
                    }
                }
                
                setLongType( descr, value );
                
                lhs.sem = { value: descr, isA: "SpecifierQualifierListDescr" };
                break;
            case "StructDeclaratorList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.1
                //  StructDeclaratorList = StructDeclarator ( COMMA StructDeclarator )*
                //                                0           1,i,0      1,i,1
                //----------------------------------------------------------------------------------------------------
                array = [ rhs[0].sem.value ];
                for( i = 0; i < rhs[1].length; i++ )
                {
                    array.push( rhs[1][i][1].sem.value );
                }
                lhs.sem = { value: array, isA: "StructDeclaratorListArray" };
                break;
            case "StructDeclarator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.1
                //  StructDeclarator = Declarator? COLON ConstantExpression / Declarator
                //                         0?        1           2                -
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.isA = "StructDeclaratorDescr";
                array = [ descr ];
                if( rhs instanceof Array )
                {
                    descr.isBitField = true;
                    descr.width = rhs[2].sem.value;
                    if( null === rhs[0] )
                    {
                        descr.hasDeclarator = false;
                    }
                    else
                    {
                        descr.hasDeclarator = true;
                        array = rhs[0].sem.value.concat( array );
                    }
                }
                else
                {
                    descr.isBitField = false;
                    array = rhs.sem.value.concat( array );
                }
                lhs.sem = { value: array, isA: "StructDeclaratorArray" };
                break;
            case "EnumSpecifier":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.2
                //  EnumSpecifier = ENUM ( Identifier? LWING EnumeratorList COMMA? RWING / Identifier )
                //                   0         1,0?     1,1       1,2        1,3?   1,4        1
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.hasTag = false;
                descr.tag = "";
                if( rhs[1] instanceof Array )
                {
                    if( null !== rhs[1][0] )
                    {
                        descr.hasTag = true;
                        descr.tag = rhs[1][0].sem.value;
                    }
                    
                    descr.members = rhs[1][2].sem.value;
                }
                else
                {
                    descr.hasTag = true;
                    descr.tag = rhs[1].sem.value;
                    descr.members = [];
                }
                lhs.sem = { value: descr, isA: "EnumSpecifierDescr" };
                break;
            case "EnumeratorList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.2
                //  EnumeratorList = Enumerator ( COMMA Enumerator )*
                //                       0        1,i,0   1,i,1
                //----------------------------------------------------------------------------------------------------
                array = [ rhs[0].sem.value ];
                for( i = 0; i < rhs[1].length; i++ )
                {
                    array.push( rhs[1][i][1].sem.value );
                }
                lhs.sem = { value: array, isA: "EnumeratorListArray" };
                break;
            case "Enumerator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.2.2
                //  Enumerator = EnumerationConstant ( EQU ConstantExpression )?
                //                      0             1?,0       1?,1
                //----------------------------------------------------------------------------------------------------
                descr = {};
                descr.enumConstant = rhs[0].sem.value;
                if( null !== rhs[1] )
                {
                    descr.equalsTo = rhs[1][1].sem;
                }
                lhs.sem = { value: descr, isA: "EnumeratorDescr" };
                break;
            case "TypeQualifier":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.3
                //  TypeQualifier = CONST / RESTRICT / VOLATILE / DECLSPEC LPAR Identifier RPAR
                //                    -        -          -          0      1       2       3
                //----------------------------------------------------------------------------------------------------
                descr = {};
                if( rhs instanceof Array )
                {
                    throw "Not implemented.";
                }
                else
                {
                    switch( rhs.isA )
                    {
                        case "CONST":
                            descr.isConst = true;
                            break;
                        case "RESTRICT":
                            descr.isRestrict = true;
                            break;
                        case "VOLATILE":
                            descr.isVolatile = true;
                            break;
                    }
                }
                lhs.sem = { value: descr, isA: "TypeQualifierDescr" };
                break;
            case "FunctionSpecifier":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.4
                //  FunctionSpecifier = INLINE / STDCALL
                //                        -         -
                //----------------------------------------------------------------------------------------------------
                descr = {};
                switch( rhs.isA )
                {
                    case "INLINE":
                        descr.isInline = true;
                        break;
                    case "STDCALL":
                        descr.isStdcall = true;
                        break;
                }
                lhs.sem = { value: descr, isA: "FunctionSpecifierDescr" };
                break;
            case "Declarator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.5
                //  Declarator = Pointer? DirectDeclarator
                //                  0?          1
                //----------------------------------------------------------------------------------------------------
                array = rhs[1].sem.value;
                if( null !== rhs[0] )
                {
                    array = array.concat( rhs[0].sem.value );
                }
                lhs.sem = { value: array, isA: "DeclaratorArray" };
                break;
            case "DirectDeclarator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.5
                //  DirectDeclarator = ( Identifier / LPAR Declarator RPAR )
                //                           0         0,0     0,1     0,2
                //                     ( LBRK TypeQualifier* AssignmentExpression? RBRK /
                //                      1,i,0     1,i,1,j          1,i,2?          1,i,3
                //                       LBRK STATIC TypeQualifier* AssignmentExpression RBRK /
                //                      1,i,0 1,i,1     1,i,2,j          1,i,3           1,i,4
                //                       LBRK TypeQualifier+ STATIC AssignmentExpression RBRK /
                //                      1,i,0    1,i,1,j     1,i,2         1,i,3         1,i,4
                //                       LBRK TypeQualifier* STAR RBRK /
                //                      1,i,0    1,i,1,j    1,i,2 1,i,3
                //                       LPAR ParameterTypeList RPAR /
                //                      1,i,0       1,i,1       1,i,2
                //                       LPAR IdentifierList? RPAR )*
                //                      1,i,0      1,i,1?     1,i,2
                //----------------------------------------------------------------------------------------------------
                if( ( rhs[0] instanceof Array ) && ( "Declarator" == rhs[0][1].isA ) )
                {
                    array = rhs[0][1].sem.value;
                }
                else
                {
                    array = [ rhs[0].sem ];
                }
                
                for( var i = 0; i < rhs[1].length; i++ )
                {
                    descr = {};
                    if( "LPAR" == rhs[1][i][0].isA )
                    {
                        descr.isA = "Function";
                        if( null === rhs[1][i][1] )
                        {
                            descr.parameters = [];
                        }
                        else if( "IdentifierList" == rhs[1][i][1].isA )
                        {
                            throw "Not implemented.";
                        }
                        else
                        {
                            descr.parameters = rhs[1][i][1].sem.value;
                        }
                    }
                    else
                    {
                        descr.isA = "Array";
                        value = rhs[1][i][ rhs[1][i].length - 2 ];
                        if(  ( null !== value ) &&
                            !( value instanceof Array ) &&
                             ( "STAR" == value.isA ) )
                        {
                            descr.elements = "VARIABLE";
                        }
                        else if( null === value )
                        {
                            descr.elements = "UNDEFINED";
                        }
                        else
                        {
                            descr.elements = value.sem;
                        }
                    }
                    array.push( descr );
                }
                lhs.sem = { value: array, isA: "DirectDeclaratorArray" };
                break;
            case "Pointer":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.5
                //  Pointer = ( STAR TypeQualifier* )+
                //              i,0      i,1,j
                //----------------------------------------------------------------------------------------------------
                array = [];
                for( i = rhs.length - 1; i >= 0; i-- )
                {
                    descr = {};
                    descr.isA = "Pointer";
                    
                    for( j = 0; j < rhs[i][1].length; j++ )
                    {
                        descr = copyObjProperties( descr, rhs[i][1][j].sem.value );
                    }
                    
                    array.push( descr );
                }
                lhs.sem = { value: array, isA: "PointerArray" };
                break;
            case "ParameterTypeList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.5
                //  ParameterTypeList = ParameterList ( COMMA ELLIPSIS )?
                //                            0          1?,0   1?,1
                //----------------------------------------------------------------------------------------------------
                if( null !== rhs[1] )
                {
                    throw "Not implemented.";
                }
                else
                {
                    lhs.sem = { value: rhs[0].sem.value, isA: "ParameterTypeListArray" };
                }
                break;
            case "ParameterList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.5
                //  ParameterList = ParameterDeclaration ( COMMA ParameterDeclaration )*
                //                           0             1,i,0        1,i,1
                //----------------------------------------------------------------------------------------------------
                array = [];
                array.push( rhs[0].sem.value );
                for( var i = 0; i < rhs[1].length; i++ )
                {
                    array.push( rhs[1][i][1].sem.value );
                }
                lhs.sem = { value: array, isA: "ParameterListArray" };
                break;
            case "ParameterDeclaration":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.5
                //  ParameterDeclaration = DeclarationSpecifiers ( Declarator / AbstractDeclarator )?
                //                                  0                  1?               1?
                //----------------------------------------------------------------------------------------------------
                array = [ rhs[0].sem.value ];
                if( null !== rhs[1] )
                {
                    if( "AbstractDeclarator" == rhs[1].isA )
                    {
                        array = rhs[1].sem.value.concat( array );
                    }
                    else
                    {
                        array = rhs[1].sem.value.slice( 1 ).concat( array );
                    }
                }
                lhs.sem = { value: array, isA: "ParameterDeclarationArray" };
            case "IdentifierList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.5
                //  IdentifierList = Identifier ( COMMA Identifier )*
                //                       0        1,i,0    1,i,1
                //----------------------------------------------------------------------------------------------------
                break;
            case "TypeName":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.6
                //  TypeName = SpecifierQualifierList AbstractDeclarator?
                //                      0                     1?
                //----------------------------------------------------------------------------------------------------
                break;
            case "AbstractDeclarator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.6
                //  AbstractDeclarator = Pointer? DirectAbstractDeclarator / Pointer
                //                          0?              1                   -
                //----------------------------------------------------------------------------------------------------
                if( rhs instanceof Array )
                {
                    array = rhs[1].sem.value;
                    if( null !== rhs[0] )
                    {
                        array = array.concat( rhs[0].sem.value );
                    }
                }
                else
                {
                    array = rhs.sem.value;
                }
                lhs.sem = { value: array, isA: "AbstractDeclaratorArray" };
                break;
            case "DirectAbstractDeclarator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.6
                //  DirectAbstractDeclarator = ( LPAR AbstractDeclarator RPAR /
                //                               0,0         0,1         0,2
                //                               LBRK ( AssignmentExpression / STAR )? RBRK /
                //                               0,0            0,1?           0,1?    0,2
                //                               LPAR ParameterTypeList? RPAR )
                //                               0,0          0,1?       0,2
                //                             ( LBRK ( AssignmentExpression / STAR )? RBRK /
                //                              1,i,0          1,i,1?         1,i,1?   1,i,2
                //                               LPAR ParameterTypeList? RPAR )*
                //                              1,i,0         1,i,1?     1,i,2
                //----------------------------------------------------------------------------------------------------
                if( ( null !== rhs[0][1] ) &&
                    ( "AbstractDeclarator" == rhs[0][1].isA ) )
                {
                    array = rhs[0][1].sem.value;
                }
                else
                {
                    array = [];
                    descr = {};
                    if( "LPAR" == rhs[0][0].isA )
                    {
                        descr.isA = "Function";
                        if( null === rhs[0][1] )
                        {
                            descr.parameters = [];
                        }
                        else
                        {
                            descr.parameters = rhs[0][1].sem.value;
                        }
                    }
                    else
                    {
                        descr.isA = "Array";
                        if( null === rhs[0][1] )
                        {
                            descr.elements = "UNDEFINED";
                        }
                        else if( "STAR" == rhs[0][1].isA )
                        {
                            descr.elements = "VARIABLE";
                        }
                        else
                        {
                            descr.elements = rhs[0][1].sem;
                        }
                    }
                    array.push( descr );
                }
                
                for( var i = 0; i < rhs[1].length; i++ )
                {
                    descr = {};
                    if( "LPAR" == rhs[1][i][0].isA )
                    {
                        descr.isA = "Function";
                        if( null === rhs[1][i][1] )
                        {
                            descr.parameters = [];
                        }
                        else
                        {
                            descr.parameters = rhs[1][i][1].sem.value;
                        }
                    }
                    else
                    {
                        descr.isA = "Array";
                        if( null === rhs[1][i][1] )
                        {
                            descr.elements = "UNDEFINED";
                        }
                        else if( "STAR" == rhs[1][i][1].isA )
                        {
                            descr.elements = "VARIABLE";
                        }
                        else
                        {
                            descr.elements = rhs[1][i][1].sem;
                        }
                    }
                    array.push( descr );
                }
                lhs.sem = { value: array, isA: "DirectAbstractDeclaratorArray" };
                break;
            case "TypedefName":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.7
                //  TypedefName = Identifier &( it is in typedefs list )
                //                    0                1-
                //----------------------------------------------------------------------------------------------------
                value = rhs[0].sem.value;
                lhs.sem = { value: value, isA: "TypedefNameDescr" };
                break;
            case "Initializer":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.8
                //  Initializer = AssignmentExpression / LWING InitializerList COMMA? RWING
                //                         -               0          1          2?     3
                //----------------------------------------------------------------------------------------------------
                break;
            case "InitializerList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.8
                //  InitializerList = Designation? Initializer ( COMMA Designation? Initializer )*
                //                        0?            1        2,i,0    2,i,1?       2,i,2
                //----------------------------------------------------------------------------------------------------
                break;
            case "Designation":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.8
                //  Designation = Designator+ EQU
                //                    0,i      1
                //----------------------------------------------------------------------------------------------------
                break;
            case "Designator":
                //----------------------------------------------------------------------------------------------------
                //  A.2.2 - 6.7.8
                //  Designator = LBRK ConstantExpression RBRK / DOT Identifier
                //                 0          1            2     0      1
                //----------------------------------------------------------------------------------------------------
                break;
            
            /*********************************************
            **********************************************
            **
            **      A.2.3   Statements
            **
            **********************************************
            *********************************************/
            
            case "Statement":
                //----------------------------------------------------------------------------------------------------
                //  A.2.3 - 6.8
                //  Statement = LabeledStatement / CompoundStatement / ExpressionStatement /
                //                     -                   -                   -
                //              SelectionStatement / IterationStatement / JumpStatement
                //                       -                    -                -
                //----------------------------------------------------------------------------------------------------
                break;
            case "LabeledStatement":
                //----------------------------------------------------------------------------------------------------
                //  A.2.3 - 6.8.1
                //  LabeledStatement = Identifier COLON Statement / CASE ConstantExpression COLON Statement /
                //                         0        1      2          0          1            2      3
                //                     DEFAULT COLON Statement
                //                        0      1      2
                //----------------------------------------------------------------------------------------------------
                break;
            case "CompoundStatement":
                //----------------------------------------------------------------------------------------------------
                //  A.2.3 - 6.8.2
                //  CompoundStatement = LWING ( Declaration / Statement )* RWING
                //                        0        1,i,0        1,i,0        2
                //----------------------------------------------------------------------------------------------------
                break;
            case "ExpressionStatement":
                //----------------------------------------------------------------------------------------------------
                //  A.2.3 - 6.8.3
                //  ExpressionStatement = Expression? SEMI
                //                             0?      1
                //----------------------------------------------------------------------------------------------------
                break;
            case "SelectionStatement":
                //----------------------------------------------------------------------------------------------------
                //  A.2.3 - 6.8.4
                //  SelectionStatement = IF LPAR Expression RPAR Statement ( ELSE Statement )? /
                //                       0   1        2      3      4        5?,0     5?,1
                //                       SWITCH LPAR Expression RPAR Statement
                //                         0     1       2       3      4
                //----------------------------------------------------------------------------------------------------
                break;
            case "IterationStatement":
                //----------------------------------------------------------------------------------------------------
                //  A.2.3 - 6.8.5
                //  IterationStatement = WHILE LPAR Expression RPAR Statement /
                //                         0     1      2        3      3
                //                       DO Statement WHILE LPAR Expression RPAR SEMI /
                //                        0     1       2     3      4        5    6
                //                       FOR LPAR Expression? SEMI Expression? SEMI Expression? RPAR Statement /
                //                        0    1       2?      3        4?      5        6?       7     8
                //                       FOR LPAR Declaration Expression? SEMI Expression? RPAR Statement
                //                        0    1       2           3?       4       5?      6       7
                //----------------------------------------------------------------------------------------------------
                break;
            case "JumpStatement":
                //----------------------------------------------------------------------------------------------------
                //  A.2.3 - 6.8.6
                //  JumpStatement = GOTO Identifier SEMI / CONTINUE SEMI / BREAK SEMI / RETURN Expression? SEMI
                //                   0        1       2        0      1      0     1       0        1?      2
                //----------------------------------------------------------------------------------------------------
                break;
            
            /*********************************************
            **********************************************
            **
            **      A.2.4   External definitions
            **
            **********************************************
            *********************************************/
            
            case "TranslationUnit":
                //----------------------------------------------------------------------------------------------------
                //  A.2.4 - 6.9
                //  TranslationUnit = Spacing ExternalDeclaration+ EOT
                //                       0            1,i           2
                //----------------------------------------------------------------------------------------------------
                break;
            case "ExternalDeclaration":
                //----------------------------------------------------------------------------------------------------
                //  A.2.4 - 6.9
                //  ExternalDeclaration = FunctionDefinition / Declaration
                //                                -                 -
                //----------------------------------------------------------------------------------------------------
                declarations = declarations.concat( rhs.sem.value );
                break;
            case "FunctionDefinition":
                //----------------------------------------------------------------------------------------------------
                //  A.2.4 - 6.9.1
                //  FunctionDefinition = DeclarationSpecifiers Declarator DeclarationList? CompoundStatement
                //                                0                1             2?                3
                //----------------------------------------------------------------------------------------------------
                if( null !== rhs[2] )
                {
                    throw "Not implemented.";
                }
                
                descr = {};
                descr.isA = "InitializerDescr";
                descr.value = [];
                
                array = [];
                array = array.concat( rhs[1].sem.value );
                array.push( rhs[0].sem.value );
                array.push( descr );
                
                lhs.sem = { value: [ array ], isA: "FunctionDefinitionArray" };
                break;
            case "DeclarationList":
                //----------------------------------------------------------------------------------------------------
                //  A.2.4 - 6.9.1
                //  DeclarationList = Declaration+
                //                         i
                //----------------------------------------------------------------------------------------------------
                break;
            
            default:
                break;
        }
        
        return;
    }
    
})();






















