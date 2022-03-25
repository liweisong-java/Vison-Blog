package com.weisong.backend.service.User;

import com.weisong.backend.entities.User.LoginUser;
import com.weisong.backend.entities.User.User;

/**
 * @author 李伟松
 * @create 2022-02-16-21:16
 */
public interface UserService {

    //    注册/添加User
    void insertUser(LoginUser loginUser);


    //    通过UUId 注销/删除User
    void deleteUserById(String userUuid);

    //    检查User的name合法
    Boolean checkName(String name);

    //    根据uuid查user
    User findUserByUuid(String userUuid);

    //    根据name查user
    User findUserByName(String name);

    //    根据Email查user
    User findUserByEmail(String email);

}
