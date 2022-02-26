package com.weisong.backend.service.impl;

import com.weisong.backend.entities.User;
import com.weisong.backend.mapper.UserMapper;
import com.weisong.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
        userMapper.insertUser(user.getUuid(),user.getName(), user.getPassword(),user.getEmail(), user.getGender(), user.getBirth());
    }

    @Override
    public void deleteUserById(Map<String,String> map) {
        userMapper.deleteUserById(map.get("uuid"));
    }

    @Override
    public void uploadHeadPortrait(User user) {
        userMapper.uploadHeadPortrait(user.getUuid(),user.getHeadPortrait());
    }

    @Override
    public Boolean checkUser(String name) {
        return userMapper.checkUser(name) == null ? true : false;
    }
}
