/**
 * Created by Pooya Azarpour on 20/04/2017.
 */

// var expression = JSON.parse('{"$and": [{"$or": [{"username1": {"$lt": 1.5e3}}, {"role": {"$any": 1.5e3}}]}, {"$or": [{"username": "x"}, {"password": {"$eq": "y"}}, {"role": {"$in": ["admin", "visitor"]}}]}]}');
var expression = JSON.parse('{"$or": [{"username": {"$null": false}}, {"roles": {"$inArray": ["admin"]}}]}');
//var expression = JSON.parse('{"$and": [{"$or": [{"username": "test"}, {"role": "admin"}]}, {"username": "p"}]}');

var stack1 = [];
var stack2 = [];
var data = [];
var count = [];
var level = 0;
var keys;

data.push(expression);

while (true) {
    keys = Object.keys(data[level]);

    if (keys.length > 1) {
        count.push({"total": keys.length, "read": 1, "position": level});
    }

    if (!Array.isArray(keys[0]) && !keys[0].match(/^[0-9]/g)) {
        if (keys[0].match(/^\$/g)) {
            var build = [];
            build.push(keys[0].replace('$', ''));
            build.push(data[level][keys[0]].length);
            stack1.push(build);
        } else {
            if (typeof data[level][keys[0]] === 'object') {
                var key = Object.keys(data[level][keys[0]])[0];
                var isArr = false;
                var isOpr = false;
                var isNull = false;
                var opr;
                switch (key) {
                    case '$neq':
                        opr = ' <> ';
                        break;
                    case '$eq':
                        opr = ' = ';
                        break;
                    case '$gt':
                        opr = ' > ';
                        break;
                    case '$gte':
                        opr = ' >= ';
                        break;
                    case '$lt':
                        opr = ' < ';
                        break;
                    case '$lte':
                        opr = ' <= ';
                        break;
                    case '$inArray':
                        opr = ' && ';
                        break;
                    case '$any':
                        opr = ' = any ';
                        isArr = true;
                        break;
                    case '$all':
                        opr = ' = all ';
                        isArr = true;
                        break;
                    case '$in':
                        opr = ' in ';
                        isOpr = true;
                        break;
                    case '$null':
                        isNull = true;
                        break;
                    default:
                        opr = ' = ';
                }

                if (Array.isArray(data[level][keys[0]][key])) {
                    var value = [];
                    for (var i = 0; i < data[level][keys[0]][key].length; i++) {
                        if (typeof data[level][keys[0]][key] === 'number') {
                            value.push(data[level][keys[0]][key][i]);
                        } else if (isOpr) {
                            value.push('\'' + data[level][keys[0]][key][i] + '\'');
                        } else {
                            value.push('\"' + data[level][keys[0]][key][i] + '\"');
                        }
                    }

                    if (isOpr) {
                        stack1.push(keys[0] + opr + '(' + value.join(', ') + ')');
                    } else {
                        stack1.push('\'{' + value.join(', ') + '}\'' + opr + keys[0]);
                    }
                } else if (isArr) {
                    stack1.push((typeof data[level][keys[0]][key] === 'number' ? data[level][keys[0]][key] : '\'' + data[level][keys[0]][key] + '\'') + opr + '(' + keys[0] + ')');
                } else if (isNull) {
                    stack1.push(keys[0] + (data[level][keys[0]][key] ? ' IS NULL' : ' IS NOT NULL'));
                } else {
                    stack1.push(keys[0] + opr + (typeof data[level][keys[0]][key] === 'number' ? data[level][keys[0]][key] : '\'' + data[level][keys[0]][key] + '\''));
                }
            } else {
                stack1.push(keys[0] + ' = ' + (typeof data[level][keys[0]] === 'number' ? data[level][keys[0]] : '\'' + data[level][keys[0]] + '\''));
            }
        }
    }

    if ((typeof data[level][keys[0]] === 'object' && Object.keys(data[level][keys[0]])[0].match(/(\$neq|\$eq|\$gt|\$gte|\$lt|\$lte|\$in|\$any|\$all|\$null)/gi)) || typeof data[level][keys[0]] !== 'object') {
        if (count.length) {
            var next = count[count.length - 1];

            data.push(data[next.position][next.read]);
            next.read++;

            if (next.read === next.total) {
                count.pop();
            }

            level++;
            continue;
        } else {
            break;
        }
    }

    data.push(data[level][keys[0]]);
    level++;
}

while (true) {
    var index1 = stack1.pop();
    if (typeof index1 === 'string') {
        stack2.push(index1);
    } else {
        var index2 = [];
        for (var j = 0; j < index1[1]; j++) {
            index2.push(stack2.pop());
        }
        stack2.push('(' + index2.join(' ' + index1[0] + ' ') + ')');
    }

    if (!stack1.length) {
        break;
    }
}

console.log('where ' + stack2[0]);