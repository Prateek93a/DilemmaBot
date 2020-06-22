"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    createUserTable: () => `create table if not exists users(id bigint primary key, state int, credibility real, has_changed int, has_asked int, has_answered int)`,
    findByPsid: (arr) => `select * from users where id=${arr[0]}`,
    findIfAsked: (arr) => `select has_asked from users where id=${arr[0]}`,
    findIfAnswered: (arr) => `select has_answered from users where id=${arr[0]}`,
    changeIfAsked: (arr) => `update users set has_asked=${arr[0]} where id=${arr[1]}`,
    getState: (arr) => `select state from users where id=${arr[0]}`,
    getCredibility: (arr) => `select credibility,has_changed from users where id=${arr[0]}`,
    updateCredibility: (arr) => `update users set credibility=${arr[0]},has_changed=${arr[1]} where id=${arr[2]}`,
    insertIntoUsers: (arr) => `insert into users(id,state,credibility,has_changed,has_asked, has_answered) values(${arr[0]},${arr[1]},${arr[2]},${arr[3]},${arr[4]},${arr[5]})`,
    updateUserState: (arr) => `update users set state=${arr[0]} where id=${arr[1]}`,
    updateUserStateReceive: (arr) => `update users set state=${arr[0]},has_asked=1 where id=${arr[1]}`,
    updateUserStateAndChange: (arr) => `update users set state=0,has_changed=0 where id=${arr[0]}`,
    resetUsers: (arr) => `update users set state=0 where id=${arr[0]}`,
};
