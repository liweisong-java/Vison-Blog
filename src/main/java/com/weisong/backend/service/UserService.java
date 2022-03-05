package com.weisong.backend.service;

import com.weisong.backend.entities.User;

import java.util.List;
import java.util.Map;

/**
 * @author 李伟松
 * @create 2022-02-16-21:16
 */
public interface UserService {

    //    注册/添加User
    void insertUser(User user);

    //    根据name   Email查user
    User findUserByNameOrEmail(User user);

    //    通过UUId 注销/删除User
    void deleteUserById(Map<String,String> map);

    //    更新用户头像
    void uploadHeadPortrait(User user);

    //    检查User的name合法
    Boolean checkName(String name);

    //    根据uuid查user
    User findUserByUuid(String userUuid);
}
