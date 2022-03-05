package com.weisong.backend.service.impl;

import com.weisong.backend.entities.User;
import com.weisong.backend.mapper.UserMapper;
import com.weisong.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
        userMapper.insertUser(user.createUserUuid(),user.getName(), user.getPassword(),user.getEmail(), user.getGender(), user.getBirth());
    }

    @Override
    public void deleteUserById(Map<String,String> map) {
        userMapper.deleteUserById(map.get("userUuid"));
    }

    @Override
    public void uploadHeadPortrait(User user) {
        userMapper.uploadHeadPortrait(user.getUserUuid(),user.getHeadPortrait());
    }

    @Override
    public Boolean checkName(String name) {
        return userMapper.checkName(name) > 0 ? true : false;
    }

    @Override
    public User findUserByNameOrEmail(User user) {
        User userByName = userMapper.findUserByNameOrEmail(user.getName(),user.getEmail());
        return userByName;
    }

    @Override
    public User findUserByUuid(String userUuid) {
        return userMapper.findUserByUuid(userUuid);
    }

}
