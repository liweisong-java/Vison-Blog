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
    public void insertUser(LoginUser loginUser) {
        userMapper.insertUser(
                UuidBuilderUtils.createUUID(),
                loginUser.getRealName(),
                loginUser.getName(),
                loginUser.getPassword(),
                loginUser.getPhone(),
                loginUser.getQq(),
                loginUser.getBirth(),
                loginUser.getEmail(),
                loginUser.getGender(),
                loginUser.getAvatar(),
                loginUser.getLastTime(),
                loginUser.getRoleId(),
                loginUser.getOneSentence(),
                loginUser.getIntro()
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
    public User findUserByName(String name) {
        User userByName = userMapper.findUserByName(name);
        return userByName;
    }

    @Override
    public User findUserByEmail(String email) {
        return userMapper.findUserByEmail(email);
    }

    @Override
    public User findUserByUuid(String userUuid) {
        User userByUuid = userMapper.findUserByUuid(userUuid);
        return userByUuid;
    }

}
