package com.weisong.backend.service.impl;

import com.weisong.backend.entities.User;
import com.weisong.backend.mapper.ArticleMapper;
import com.weisong.backend.service.ArticleService;
import com.weisong.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:41
 */
@Service
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    ArticleMapper articleMapper;

    @Override
    public List<User> getAllArticle() {
        return articleMapper.getAllArticle();
    }
}
