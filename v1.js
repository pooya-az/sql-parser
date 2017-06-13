/**
 * Created by Pooya Azarpour on 20/04/2017.
 */

// var obj = [
//     {
//         '$and': [
//             {'$or': [{'username': '3'}, {'roles': 'visitor'}]},
//             {'$or': [{'username': 'admin'}, {'password': '123'}, {'roles': 'data'}]}
//         ]
//     }
// ];
// var expression = [
//     {
//         $and : [
//             { $or : [ { price : 0.99 }, { price : 1.99 } ] },
//             { $or : [ { sale : true }, { qty : { $lt : 20 } } ] }
//         ]
//     }
// ];
// var expression = [
//     {
//         $and: [
//             {'$or': [{'username': 'test'}, {'role': 'admin'}]},
//             {'username': 'p'}
//         ]
//     }
// ];

var expression = JSON.parse('{"$and": [{"$or": [{"username1": {"$lt": "test"}}, {"role": "admin"}]}, {"$or": [{"username": "x"}, {"password": "y"}, {"role": "z"}]}]}');

var finish = false;
var data = [];
var count = [];
var level = 0;
var i, j;
var keys;

var stack1 = [];
var stack2 = [];

data.push(expression);
count.push(0);

while (true) {
    keys = Object.keys(data[level]);

    var next = false;
    for (i = 0; i < keys.length; i++) {
        if (!keys[i].match(/^(\$and|\$or|[0-9]+)$/gi)) {
            next = true;
            break;
        }
    }

    if (next) {
        j = 1;
        while (true) {
            if (level - j < 0) {
                finish = true;
                break;
            } else if (data[level - j].length > 1) {
                if (typeof data[level - j][count[level - j] + 1] !== 'undefined') {
                    level -= j;
                    count[level]++;
                    break;
                }
            }
            j++;
        }

        if (finish) {
            break;
        } else {
            data.push(data[level][count[level]]);
            count.push(0);
            level += j + 1;
        }
    } else {
        data.push(data[level][keys[0]]);
        count.push(0);
        level++;
    }
}

for (i = 1; i < data.length; i++) {
    var list = Object.keys(data[i]);
    if (!Array.isArray(data[i]) && list.length) {
        for (j = 0; j < list.length; j++) {
            var value = data[i][list[j]];
            if (list[j].match(/^\$/g)) {
                var build = [];
                build.push(list[j].replace('$', ''));
                build.push(value.length);
                stack1.push(build);
            } else {
                if (typeof value == 'object') {
                    var opr;
                    switch (Object.keys(value)[0]) {
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
                        default:
                            opr = ' = ';
                    }
                    stack1.push(list[j] + opr + value);
                } else {
                    stack1.push(list[j] + ' = ' + value);
                }

            }
        }
    }
}

while (true) {
    var index1 = stack1.pop();
    if (typeof index1 === 'string') {
        stack2.push(index1);
    } else {
        var index2 = [];
        for (i = 0; i < index1[1]; i++) {
            index2.push(stack2.pop());
        }
        stack2.push('(' + index2.join(' ' + index1[0] + ' ') + ')');
    }

    if (!stack1.length) {
        break;
    }
}

console.log('where ' + stack2[0]);