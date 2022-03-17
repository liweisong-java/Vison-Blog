package com.weisong.backend.service.impl;

import com.weisong.backend.entities.LoginUser;
import com.weisong.backend.entities.User;
import com.weisong.backend.mapper.UserMapper;
import com.weisong.backend.service.UserService;
import com.weisong.backend.util.UuidBuilderUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * @author 李伟松
 * @create 2022-02-16-19:37
 */
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    UserMapper userMapper;

    @Override
    public void insertUser(User user) {
        userMapper.insertUser(
                UuidBuilderUtils.createUUID(),
                user.getRealName(),
                user.getName(),
                user.getPassword(),
                user.getPhone(),
                user.getQq(),
                user.getBirth(),
                user.getEmail(),
                user.getGender(),
                user.getAvatar(),
                user.getLastTime(),
                user.getRoleId()
        );

    }

    @Override
    public void deleteUserById(String userUuid) {
        userMapper.deleteUserById(userUuid);
    }

    //是否有重复用户名
    @Override
    public Boolean checkName(String name) {
        return userMapper.checkName(name) > 0 ? true : false;
    }

    @Override
    public User findUserByNameOrEmail(LoginUser loginUser) {
        return userMapper.findUserByNameOrEmail(loginUser.getName(),loginUser.getEmail());
    }

    @Override
    public User findUserByUuid(String userUuid) {
        User userByUuid = userMapper.findUserByUuid(userUuid);
        return userByUuid;
    }

}
