export default {
    createUserTable: () => `create table if not exists users(id bigint primary key, state int, credibility real, has_changed int, has_asked int, has_answered int)`,
    findByPsid: (arr: any[]) => `select * from users where id=${arr[0]}`,
    findIfAsked: (arr: any[]) => `select has_asked from users where id=${arr[0]}`,
    findIfAnswered: (arr: any[]) => `select has_answered from users where id=${arr[0]}`,
    changeIfAsked: (arr: any[]) => `update users set has_asked=${arr[0]} where id=${arr[1]}`,
    getState: (arr: any[]) => `select state from users where id=${arr[0]}`,
    getCredibility: (arr: any[]) => `select credibility,has_changed from users where id=${arr[0]}`,
    updateCredibility: (arr: any[]) => `update users set credibility=${arr[0]},has_changed=${arr[1]} where id=${arr[2]}`,
    insertIntoUsers: (arr: any[]) => `insert into users(id,state,credibility,has_changed,has_asked, has_answered) values(${arr[0]},${arr[1]},${arr[2]},${arr[3]},${arr[4]},${arr[5]})`,
    updateUserState: (arr: any[]) => `update users set state=${arr[0]} where id=${arr[1]}`,
    updateUserStateReceive: (arr: any[]) => `update users set state=${arr[0]},has_answered=1 where id=${arr[1]}`,
    updateUserStateAndChange: (arr: any[]) => `update users set state=0,has_changed=0 where id=${arr[0]}`,
    resetUsers: (arr: any[]) => `update users set state=0 where id=${arr[0]}`,
}